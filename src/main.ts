import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common/pipes';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  const swaggerConfig = new DocumentBuilder()
    .setTitle('BLURTING API')
    .setDescription('API for BLURTING service')
    .setVersion('1.0')
    .build();

  const docs = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, docs);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  console.log(process.env.MONGO_URI);
  console.log(
    process.env.DB_HOST,
    process.env.DB_PORT,
    process.env.DB_USERNAME,
    process.env.DB_PASSWORD,
    process.env.DB_DATABASE,
  );

  await app.listen(3081);
}

bootstrap();
