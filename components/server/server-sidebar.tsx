import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { MemberRole, channelType } from "@prisma/client";
import { redirect } from "next/navigation";
import ServerHeader from "./server-header";
import { ScrollArea } from "../ui/scroll-area";
import ServerSearch from "./server-search";
import { Hash, Video, Mic, ShieldCheck, ShieldAlert } from "lucide-react";
import { channel } from "diagnostics_channel";

interface ServerSidebarProps {
  serverId: string;
}

const iconMap = {
  [channelType.TEXT]: <Hash className="mr-2 h-4 w-4" />,
  [channelType.AUDIO]: <Mic className="mr-2 h-4 w-4" />,
  [channelType.VIDEO]: <Video className="mr-2 h-4 w-4" />,
};

const roleIconMap = {
  [MemberRole.GUEST]: null,
  [MemberRole.MODERATOR]: (
    <ShieldCheck className="h-4 w-4 mr-2 text-indigo-500"></ShieldCheck>
  ),
  [MemberRole.ADMIN]: (
    <ShieldAlert className="h-4 w-4 mr-2 text-rose-500"></ShieldAlert>
  ),
};

export const ServerSidebar = async ({ serverId }: ServerSidebarProps) => {
  const profile = await currentProfile();

  if (!profile) {
    redirect("/");
  }

  const server = await db.server.findUnique({
    where: {
      id: serverId,
    },
    include: {
      channels: {
        orderBy: {
          createdAt: "asc",
        },
      },
      members: {
        include: {
          profile: true,
        },
        orderBy: {
          role: "asc", // Admin , moderators and then the guest
        },
      },
    },
  });

  //Separate Channels
  const textChannels = server?.channels.filter(
    (channel) => channel.type === channelType.TEXT
  );
  const audioChannels = server?.channels.filter(
    (channel) => channel.type === channelType.AUDIO
  );
  const videoChannels = server?.channels.filter(
    (channel) => channel.type === channelType.VIDEO
  );

  // Show all the members except current profile
  const members = server?.members.filter(
    (member) => member.profileId !== profile.id
  );

  if (!server) {
    return redirect("/");
  }

  const role = server.members.find(
    (member) => member.profileId === profile.id
  )?.role;

  return (
    <div className="flex flex-col h-full text-primary w-full dark:bg-[#2B2D31] bg-[#F2F3F5]">
      <ServerHeader server={server} role={role} />
      <ScrollArea className="flex-1 px-3">
        <div className="mt-2">
          <ServerSearch
            data={[
              {
                label: "Text Channels",
                type: "channel",
                data: textChannels?.map((channel) => ({
                  id: channel.id,
                  name: channel.name,
                  icon: iconMap[channel.type],
                })),
              },
              {
                label: "Voice Channels",
                type: "channel",
                data: audioChannels?.map((channel) => ({
                  id: channel.id,
                  name: channel.name,
                  icon: iconMap[channel.type],
                })),
              },
              {
                label: "Video Channels",
                type: "channel",
                data: videoChannels?.map((channel) => ({
                  id: channel.id,
                  name: channel.name,
                  icon: iconMap[channel.type],
                })),
              },
              {
                label: "Members",
                type: "member",
                data: members?.map((member) => ({
                  id: member.id,
                  name: member.profile.name,
                  icon: roleIconMap[member.role],
                })),
              },
            ]}
          />
        </div>
      </ScrollArea>
    </div>
  );
};

export default ServerSidebar;
