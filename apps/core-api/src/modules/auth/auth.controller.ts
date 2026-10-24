import type { AuthUserDto, LoginResponseDto } from "@mc/shared";
import { Body, Controller, Get, HttpCode, Inject, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../common/decorators/current-user.decorator.js";
import { Public } from "../../common/decorators/public.decorator.js";
import { AuthService } from "./auth.service.js";
import type { AuthUser } from "./auth.types.js";
import type { LoginDto } from "./dto/login.dto.js";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Public()
  @Post("login")
  @HttpCode(200)
  @ApiOperation({ summary: "Exchange credentials for a JWT" })
  login(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(dto);
  }

  @Get("me")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Current authenticated user" })
  me(@CurrentUser() user: AuthUser): AuthUserDto {
    return user;
  }
}
