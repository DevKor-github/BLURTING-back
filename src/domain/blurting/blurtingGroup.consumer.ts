import {
  Processor,
  Process,
  InjectQueue,
  OnQueueError,
  OnQueueStalled,
  OnQueueFailed,
} from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { BlurtingService } from './blurting.service';
import { FcmService } from 'src/domain/firebase/fcm.service';

@Processor('renewaledBlurting')
export class BlurtingRConsumer {
  constructor(
    private blurtingService: BlurtingService,
    private fcmService: FcmService,
    @InjectQueue('renewaledBlurting') private readonly queue: Queue,
  ) {}
  @Process()
  processNewBlurtingQuestion(job: Job) {
    this.blurtingService.processPreQuestions(
      {
        id: job.data.group.id,
        createdAt: new Date(Date.parse(job.data.group.createdAt)),
        questions: [],
      },
      job.data.no,
      job.data.users,
    );
  }
  @OnQueueError()
  queueErrorHandler(error: Error) {
    console.log('job error occured');
    console.log(error);
  }

  @OnQueueStalled()
  queueStallHandler(job: Job) {
    console.log('job stalled');
    console.log(job.data);
  }

  @OnQueueFailed()
  queueFailHandler(job: Job, error: Error) {
    console.log('job failed');
    console.log(job.failedReason);
    console.log(error);
  }
}
