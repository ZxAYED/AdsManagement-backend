import { Request, Response } from "express";
import { paginationHelper } from '../../../helpers/paginationHelper';
import prisma from "../../../shared/prisma";
import AppError from "../../Errors/AppError";


const getAllChatHistories = async (req: Request, res: Response) => {
    const userId = (req as any).user!.id;
    const peerId = String(req.query.peerId || "");
    if (!peerId) throw new AppError(400, "peerId is required");

    const rawLimit = Number(req.query.limit) || 50;
    const limit = Math.min(Math.max(rawLimit, 1), 100);
    const cursor = paginationHelper.decodeCursor(req.query.cursor as string | undefined);

    const between = {
        OR: [
            { senderId: userId, receiverId: peerId },
            { senderId: peerId, receiverId: userId },
        ],
    };

    const where = cursor
        ? {
            AND: [
                between,
                {
                    OR: [
                        { createdAt: { lt: cursor.createdAt } },
                        { AND: [{ createdAt: cursor.createdAt }, { id: { lt: cursor.id } }] },
                    ],
                },
            ],
        }
        : between;

    const items = await prisma.message.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: limit + 1,
        select: {
            id: true,
            text: true,
            createdAt: true,
            senderId: true,
            receiverId: true,
        },
    });

    const hasMore = items.length > limit;
    const page = hasMore ? items.slice(0, limit) : items;

    const nextCursor = hasMore
        ? paginationHelper.encodeCursor(page[page.length - 1].createdAt, page[page.length - 1].id)
        : null;
    return ({ items: page, nextCursor })

}


const getAllChatList = async (req: Request, res: Response) => {
    const userId = (req as any).user!.id;

    const rawLimit = Number(req.query.limit) || 20;
    const limit = Math.min(Math.max(rawLimit, 1), 50);
    const cursor = paginationHelper.decodeCursor(req.query.cursor as string | undefined);

    // bounded window of messages touching this user
    const WINDOW = 400; // tune as needed
    const baseWhere: any = { OR: [{ senderId: userId }, { receiverId: userId }] };
    const where = cursor
        ? {
            AND: [
                baseWhere,
                {
                    OR: [
                        { createdAt: { lt: cursor.createdAt } },
                        { AND: [{ createdAt: cursor.createdAt }, { id: { lt: cursor.id } }] },
                    ],
                },
            ],
        }
        : baseWhere;

    const baseMessages = await prisma.message.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: WINDOW,
        select: { id: true, senderId: true, receiverId: true, text: true, createdAt: true },
    });

    // pick newest per counterpart
    const otherOf = (m: any) => (m.senderId === userId ? m.receiverId : m.senderId);
    const newestByOther = new Map<string, (typeof baseMessages)[number]>();
    for (const m of baseMessages) {
        const other = otherOf(m);
        if (!newestByOther.has(other)) newestByOther.set(other, m);
        if (newestByOther.size >= limit + 5) break;
    }

    const others = [...newestByOther.keys()];
    const profiles = others.length
        ? await prisma.user.findMany({
            where: { id: { in: others } },
            select: { id: true, first_name: true, last_name: true, image: true, role: true },
        })
        : [];
    const profileMap = new Map(profiles.map((u) => [u.id, u]));

    const rows = others
        .map((oid) => ({
            counterpart: profileMap.get(oid) || {
                id: oid,
                first_name: "",
                last_name: "",
                image: null as string | null,
                role: "",
            },
            lastMessage: newestByOther.get(oid)!,
        }))
        .sort((a, b) => +new Date(b.lastMessage.createdAt) - +new Date(a.lastMessage.createdAt));

    const page = rows.slice(0, limit);
    const last = page[page.length - 1]?.lastMessage || null;
    const nextCursor = last ? paginationHelper.encodeCursor(last.createdAt, last.id) : null;

    return ({ items: page, nextCursor });
}


export const ChatServices = {
    getAllChatHistories,
    getAllChatList
}