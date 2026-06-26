from typing import Literal, TypeAlias

MOST_USED_PLATFORMS = (
    "Instagram",
    "Twitter",
    "TikTok",
    "YouTube",
    "Facebook",
    "LinkedIn",
    "Snapchat",
    "LINE",
    "KakaoTalk",
    "VKontakte",
    "WhatsApp",
    "WeChat",
)

MostUsedPlatform: TypeAlias = Literal[*MOST_USED_PLATFORMS]


def get_most_used_platforms() -> list[str]:
    return list(MOST_USED_PLATFORMS)
