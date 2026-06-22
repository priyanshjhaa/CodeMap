import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service.js";
import { AuthGuard } from "../../common/guards/auth.guard.js";

@Global()
@Module({
  providers: [PrismaService, AuthGuard],
  exports: [PrismaService, AuthGuard]
})
export class DatabaseModule {}
