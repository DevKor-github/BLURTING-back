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
import { BlurtingGroupEntity } from 'src/domain/entities';
import { FcmService } from 'src/domain/firebase/fcm.service';
import { ChatService } from 'src/domain/chat/chat.service';

@Processor('blurtingQuestions')
export class BlurtingConsumer {
  constructor(
    private readonly blurtingService: BlurtingService,
    private readonly fcmService: FcmService,
    private readonly chatService: ChatService,
    @InjectQueue('blurtingQuestions') private readonly queue: Queue,
  ) {}

  // @Process()
  // async processNewBlurtingQuestion(job: Job) {
  //   const question: string = job.data.question;
  //   const group: BlurtingGroupEntity = job.data.group;
  //   const users: number[] = job.data.users;

  //   if (question === null) {
  //     await Promise.all(
  //       users.map(async (userid) => {
  //         await this.fcmService.sendPush(
  //           userid,
  //           `블러팅이 종료되었습니다. 원하는 상대에게 화살을 보내세요!`,
  //           'blurting',
  //         );
  //         await this.chatService.finishFreeChatRoom(userid);
  //       }),
  //     );
  //     await this.chatService.blockWhispers(group.createdAt, users);
  //     return;
  //   }
  //   await this.blurtingService.insertQuestionToGroup(
  //     question,
  //     group,
  //     job.data.no,
  //   );
  //   await Promise.all(
  //     users.map(async (userid) => {
  //       await this.fcmService.sendPush(
  //         userid,
  //         `${job.data.no}번째 질문이 등록되었습니다!`,
  //         'blurting',
  //       );
  //     }),
  //   );
  // }

  // @OnQueueError()
  // queueErrorHandler(error: Error) {
  //   console.log('job error occured');
  //   console.log(error);
  // }

  // @OnQueueStalled()
  // queueStallHandler(job: Job) {
  //   console.log('job stalled');
  //   console.log(job.data);
  // }

  // @OnQueueFailed()
  // queueFailHandler(job: Job, error: Error) {
  //   console.log('job failed');
  //   console.log(job.failedReason);
  //   console.log(error);
  // }
}
