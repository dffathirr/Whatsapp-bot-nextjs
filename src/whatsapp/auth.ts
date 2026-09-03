import {
  initAuthCreds,
  BufferJSON,
  AuthenticationState,
  AuthenticationCreds,
  SignalDataTypeMap,
} from "@whiskeysockets/baileys";
import { prisma } from "../lib/prisma";

export const usePrismaAuthState = async (sessionName: string) => {
  let session = await prisma.whatsappSession.findUnique({
    where: { sessionName },
  });

  let creds: AuthenticationCreds;

  if (session && session.creds) {
    creds = JSON.parse(JSON.stringify(session.creds), BufferJSON.reviver);
  } else {
    creds = initAuthCreds();
    session = await prisma.whatsappSession.upsert({
      where: { sessionName },
      update: {},
      create: {
        sessionName,
        creds: JSON.parse(JSON.stringify(creds, BufferJSON.replacer)),
      },
    });
  }

  const saveCreds = async () => {
    const phone = creds.me?.id?.split(":")[0] || creds.me?.id?.split("@")[0];

    await prisma.whatsappSession.update({
      where: { sessionName },
      data: {
        phone: phone || null,
        creds: JSON.parse(JSON.stringify(creds, BufferJSON.replacer)),
      },
    });
  };

  const state: AuthenticationState = {
    creds,
    keys: {
      get: async <T extends keyof SignalDataTypeMap>(type: T, ids: string[]) => {
        const data: { [id: string]: SignalDataTypeMap[T] } = {};

        await Promise.all(
          ids.map(async (id) => {
            const val = await prisma.whatsappSessionKey.findUnique({
              where: {
                sessionId_keyType_keyId: {
                  sessionId: session!.id,
                  keyType: type,
                  keyId: id,
                },
              },
            });

            if (val && val.value) {
              data[id] = JSON.parse(
                JSON.stringify(val.value),
                BufferJSON.reviver,
              ) as SignalDataTypeMap[T];
            }
          }),
        );

        return data;
      },
      set: async (data) => {
        const tasks: Promise<unknown>[] = [];
        for (const category in data) {
          for (const id in data[category as keyof typeof data]) {
            const value = data[category as keyof typeof data]?.[id];
            const key = {
              sessionId: session!.id,
              keyType: category,
              keyId: id,
            };

            if (value) {
              tasks.push(
                prisma.whatsappSessionKey.upsert({
                  where: { sessionId_keyType_keyId: key },
                  create: {
                    ...key,
                    value: JSON.parse(
                      JSON.stringify(value, BufferJSON.replacer),
                    ),
                  },
                  update: {
                    value: JSON.parse(
                      JSON.stringify(value, BufferJSON.replacer),
                    ),
                  },
                }),
              );
            } else {
              tasks.push(
                prisma.whatsappSessionKey
                  .delete({
                    where: { sessionId_keyType_keyId: key },
                  })
                  .catch(() => {}), // Ignore if not exists
              );
            }
          }
        }
        await Promise.all(tasks);
      },
    },
  };

  return { state, saveCreds };
};
