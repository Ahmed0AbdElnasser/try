import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const userData = await req.json();

        if (!userData || !userData.telegramId) {
            return NextResponse.json({ error: 'Invalid user data' }, { status: 400 });
        }

        // حاول العثور على المستخدم باستخدام telegramId
        let user = await prisma.user.findUnique({
            where: { telegramId: userData.telegramId }
        });

        if (!user) {
            // إذا لم يكن المستخدم موجودًا، قم بإنشاء مستخدم جديد
            user = await prisma.user.create({
                data: {
                    telegramId: userData.telegramId,
                    username: userData.username || '',
                    firstName: userData.firstName || '',
                    lastName: userData.lastName || '',
                    points: userData.points || 0,
                    invitedCount: userData.invitedCount || 0,
                    referralLink: userData.referralLink || '' // إضافة رابط الدعوة إذا كان موجودًا
                }
            });
        } else {
            // إذا كان المستخدم موجودًا، يمكنك تحديث بعض البيانات إذا لزم الأمر
            user = await prisma.user.update({
                where: { telegramId: userData.telegramId },
                data: {
                    username: userData.username || user.username, // الاحتفاظ بالقيم القديمة إذا لم يتم تقديم قيم جديدة
                    firstName: userData.firstName || user.firstName,
                    lastName: userData.lastName || user.lastName,
                    points: userData.points || user.points,
                    invitedCount: userData.invitedCount || user.invitedCount,
                    referralLink: userData.referralLink || user.referralLink,
                }
            });
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error('Error processing user data:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
