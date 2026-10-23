import type { LoginResponseDto } from "@mc/shared";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import type { JwtService } from "@nestjs/jwt";
import type { UsersService } from "../users/users.service.js";
import type { LoginDto } from "./dto/login.dto.js";

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<LoginResponseDto> {
    const user = await this.usersService.findByEmailWithPassword(dto.email);
    if (!user || !user.isActive) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const valid = await this.usersService.verifyPassword(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException("Invalid email or password");
    }

    await this.usersService.markLogin(user.id);

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      expiresIn: this.expiresInSeconds(),
      user: { id: user.id, email: user.email, role: user.role },
    };
  }

  private expiresInSeconds(): number {
    const expiresIn = process.env.JWT_EXPIRES_IN ?? "12h";
    const match = /^(\d+)([smhd])$/.exec(expiresIn);
    if (!match) return 43_200;
    const value = Number(match[1]);
    const unit = match[2];
    const multiplier = unit === "s" ? 1 : unit === "m" ? 60 : unit === "h" ? 3_600 : 86_400;
    return value * multiplier;
  }
}
