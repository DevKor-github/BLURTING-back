import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';

@Processor('blurtingQuestions')
export class BlurtingConsumer {
  @Process()
  async processNewBlurtingQuestion(job: Job) {
    console.log(job.data.id);
  }
}
