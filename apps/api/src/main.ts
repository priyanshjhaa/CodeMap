import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./modules/common/app.module.js";
import { validateEnv } from "./config/env.js";
import { HttpErrorFilter } from "./common/filters/http-exception.filter.js";

async function bootstrap() {
  validateEnv();
  const app = await NestFactory.create(AppModule, { cors: true, rawBody: true });

  app.setGlobalPrefix("api");
  app.useGlobalFilters(new HttpErrorFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: false
    })
  );

  await app.listen(4000);
}

bootstrap();
