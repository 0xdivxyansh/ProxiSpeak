import { Request, Response, NextFunction } from 'express';
import { UserService, defaultUserService } from './user.service';
import { sendSuccess } from '../../common/utils/response';
import { UnauthorizedError } from '../../common/errors/app-error';

export class UserController {
  constructor(private userService: UserService = defaultUserService) {}

  getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User authentication context is missing');
      }

      const profile = await this.userService.getOrCreateProfile(req.user.uid, {
        email: req.user.email,
        displayName: req.user.displayName,
      });

      sendSuccess(res, profile, 200, req.id);
    } catch (err) {
      next(err);
    }
  };

  updateMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User authentication context is missing');
      }

      const updatedProfile = await this.userService.updateProfile(req.user.uid, req.body);
      sendSuccess(res, updatedProfile, 200, req.id);
    } catch (err) {
      next(err);
    }
  };
}

export const defaultUserController = new UserController();
