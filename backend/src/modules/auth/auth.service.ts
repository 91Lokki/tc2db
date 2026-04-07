import { gameRules } from "../../config/gameRules";
import { comparePassword, hashPassword } from "../../lib/password";
import { prisma } from "../../lib/prisma";
import { signAuthToken } from "../../lib/jwt";
import { AppError } from "../../shared/errors/app-error";

type RegisterInput = {
  username: string;
  password: string;
};

type LoginInput = {
  username: string;
  password: string;
};

type ChangePasswordInput = {
  targetPlayerId: number;
  requesterPlayerId: number;
  oldPassword: string;
  newPassword: string;
};

type DeletePlayerInput = {
  targetPlayerId: number;
  requesterPlayerId: number;
};

async function findPlayerByUsername(username: string) {
  return prisma.player.findFirst({
    where: {
      username: {
        equals: username,
        mode: "insensitive"
      }
    }
  });
}

export async function registerPlayer(input: RegisterInput) {
  const existingPlayer = await findPlayerByUsername(input.username);
  if (existingPlayer) {
    throw new AppError(409, "Username is already taken", "USERNAME_TAKEN");
  }

  const passwordHash = await hashPassword(input.password);

  const player = await prisma.player.create({
    data: {
      username: input.username,
      passwordHash,
      money: gameRules.startingMoney,
      isAdmin: false
    },
    select: {
      id: true,
      username: true,
      regDate: true
    }
  });

  return {
    playerId: player.id,
    username: player.username,
    regDate: player.regDate
  };
}

export async function loginPlayer(input: LoginInput) {
  const player = await findPlayerByUsername(input.username);
  if (!player || player.accountStatus !== "ACTIVE" || player.deletedAt) {
    throw new AppError(401, "Invalid username or password", "INVALID_CREDENTIALS");
  }

  const passwordMatches = await comparePassword(input.password, player.passwordHash);
  if (!passwordMatches) {
    throw new AppError(401, "Invalid username or password", "INVALID_CREDENTIALS");
  }

  const token = signAuthToken({
    playerId: player.id,
    username: player.username,
    isAdmin: player.isAdmin
  });

  return {
    token,
    playerId: player.id,
    username: player.username,
    isAdmin: player.isAdmin
  };
}

export async function changePlayerPassword(input: ChangePasswordInput) {
  if (input.targetPlayerId !== input.requesterPlayerId) {
    throw new AppError(403, "You can only change your own password", "FORBIDDEN");
  }

  const player = await prisma.player.findUnique({
    where: { id: input.targetPlayerId }
  });

  if (!player || player.accountStatus !== "ACTIVE" || player.deletedAt) {
    throw new AppError(404, "Player not found", "PLAYER_NOT_FOUND");
  }

  const passwordMatches = await comparePassword(input.oldPassword, player.passwordHash);
  if (!passwordMatches) {
    throw new AppError(400, "Old password is incorrect", "INVALID_OLD_PASSWORD");
  }

  const nextPasswordHash = await hashPassword(input.newPassword);

  await prisma.player.update({
    where: { id: player.id },
    data: {
      passwordHash: nextPasswordHash
    }
  });

  return {
    success: true
  };
}

export async function softDeletePlayer(input: DeletePlayerInput) {
  if (input.targetPlayerId !== input.requesterPlayerId) {
    throw new AppError(403, "You can only delete your own account", "FORBIDDEN");
  }

  await prisma.$transaction(async (tx) => {
    const player = await tx.player.findUnique({
      where: { id: input.targetPlayerId }
    });

    if (!player || player.accountStatus !== "ACTIVE" || player.deletedAt) {
      throw new AppError(404, "Player not found", "PLAYER_NOT_FOUND");
    }

    await tx.ownedCar.updateMany({
      where: {
        playerId: player.id,
        onSale: true
      },
      data: {
        onSale: false,
        salePrice: null,
        listingDate: null
      }
    });

    await tx.player.update({
      where: { id: player.id },
      data: {
        accountStatus: "DELETED",
        deletedAt: new Date()
      }
    });

    await tx.moneyTransaction.create({
      data: {
        playerId: player.id,
        type: "ACCOUNT_CLOSURE",
        amount: 0,
        description: "Account closed by player request"
      }
    });
  });

  return {
    success: true
  };
}
