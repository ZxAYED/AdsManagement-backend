import { USER_ROLE } from '@prisma/client';
import express from 'express';
import RoleValidation from '../../middlewares/RoleValidation';
import { ChatController } from './chat.controller';

const router = express.Router();

router.get("/getHistories", RoleValidation(USER_ROLE.admin, USER_ROLE.customer), ChatController.getChatHistories);
router.get("/getLists", RoleValidation(USER_ROLE.admin, USER_ROLE.customer), ChatController.getChatLists);


export const ChatRoutes = router;