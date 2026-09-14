import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)))
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, forbidNonWhitelisted: true, transform: true, transformOptions: {
      enableImplicitConversion: true,
    },
  }))
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  })
  app.use(cookieParser())
  const config = new DocumentBuilder()
    .setTitle('Coffee Shop Api')
    .setDescription('Api Documentation for cafe management system')
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'Authorization',
      description: 'Enter JWT token',
      in: 'header'
    }, 'access_token')
    .build()
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api-docs', app, document)
  await app.listen(process.env.PORT ?? 8000);
}
bootstrap();
