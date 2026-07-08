import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, RequestUser } from '../auth/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';

@UseGuards(JwtAuthGuard)
@Controller('users/me')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch()
  update(@CurrentUser() user: RequestUser, @Body() dto: UpdateUserDto) {
    return this.usersService.update(user.userId, dto);
  }

  @Get('competences')
  competences(@CurrentUser() user: RequestUser) {
    return this.usersService.competences(user.userId);
  }

  @Get('logiciels')
  logiciels(@CurrentUser() user: RequestUser) {
    return this.usersService.logiciels(user.userId);
  }

  @Get('badges')
  badges(@CurrentUser() user: RequestUser) {
    return this.usersService.badges(user.userId);
  }

  @Get('certificats')
  certificats(@CurrentUser() user: RequestUser) {
    return this.usersService.certificats(user.userId);
  }

  @Get('notifications')
  notifications(@CurrentUser() user: RequestUser) {
    return this.usersService.notifications(user.userId);
  }

  @Patch('notifications/:id/lue')
  marquerLue(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.usersService.marquerNotificationLue(user.userId, id);
  }

  @Get('messages')
  messages(@CurrentUser() user: RequestUser) {
    return this.usersService.messages(user.userId);
  }

  @Patch('messages/lues')
  marquerMessagesLus(@CurrentUser() user: RequestUser) {
    return this.usersService.marquerMessagesLus(user.userId);
  }
}
