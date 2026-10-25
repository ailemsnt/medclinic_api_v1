import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { JwtService } from '../../auth/jwt/jwt.service';
import { Request } from 'express';
import { AuthUserDto } from '../dto/auth-user.dto';
import { Reflector } from '@nestjs/core';
import { DomainError, ERROR_CODE } from '../errors/domain.error';
import { RoleMetadata, ROLES_METADATA_KEY } from '../decorators/roles.decorator';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService, 
    private readonly reflector: Reflector ) {}

  private extractToken(context: ExecutionContext): string {
    const expressReq = context.switchToHttp().getRequest<Request>();

    const authHeader = expressReq.headers.authorization;

    if (!authHeader) {
      throw new DomainError('Token não informado', ERROR_CODE.NAO_AUTENTICADO);
    }

    const [bearerString, token] = authHeader.split(' ');

    if (!token || bearerString !== 'Bearer') {
      throw new DomainError('Token inválido', ERROR_CODE.NAO_AUTENTICADO);
    }

    return token;
  }

  private setPayload(context: ExecutionContext, payload: AuthUserDto) {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthUserDto }>();
    request.user = payload;
  }

  private hasRequiredRoles(context: ExecutionContext, payload: AuthUserDto,): boolean {
    const metadata = this.reflector.getAllAndOverride<RoleMetadata | undefined> (ROLES_METADATA_KEY, [context.getHandler(), context.getClass()]);

    if (!metadata) {
      return true;
    }
    
    const userRoles: string[] = payload.data.roles ?? [];
    return metadata.mode === 'every'
      ? metadata.requiredRoles.every((role) => userRoles.includes(role))
      : metadata.requiredRoles.some((role) => userRoles.includes(role));
  
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const payload = this.jwtService.verify(this.extractToken(context));
    if (payload.iss !== 'sctec') {
      throw new DomainError('Token inválido', ERROR_CODE.NAO_AUTENTICADO);
    }
    this.setPayload(context, payload);
    return true;
  }
}
