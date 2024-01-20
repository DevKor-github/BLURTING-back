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
import { BlurtingGroupEntity } from 'src/entities';
import { FcmService } from 'src/firebase/fcm.service';

@Processor('blurtingQuestions')
export class BlurtingConsumer {
  constructor(
    private blurtingService: BlurtingService,
    private fcmService: FcmService,
    @InjectQueue('blurtingQuestions') private readonly queue: Queue,
  ) {}
  @Process()
  async processNewBlurtingQuestion(job: Job) {
    const question: string = job.data.question;
    if (question === null) {
      const group = job.data.group;
      await this.blurtingService.deleteGroup(group);
      return;
    }
    const group: BlurtingGroupEntity = job.data.group;
    const users: number[] = job.data.users;
    await this.blurtingService.insertQuestionToGroup(
      question,
      group,
      job.data.no,
    );
    await Promise.all(
      users.map(async (userid) => {
        await this.fcmService.sendPush(
          userid,
          `${job.data.no}번째 질문이 등록되었습니다!`,
          'blurting',
        );
      }),
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
