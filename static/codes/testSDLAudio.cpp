/*
 * this file contained an example of how to use SDL2 to play WAV sound.
 */
#include "SDL.h"

struct Sound {
    Uint8* data;
    Uint32 len;
    Uint32 curPos;
};

void AudioCallback(void* userdata, Uint8* stream, int len) {
    Sound* sound = (Sound*)userdata;
    if (sound->data && sound->curPos < sound->len) {
        SDL_memset(stream, 0, len);
        int64_t remaning = sound->len - sound->curPos;
        if (remaning > len) {
            SDL_MixAudio(stream, sound->data + sound->curPos, len, SDL_MIX_MAXVOLUME);
            sound->curPos += len;
        } else {
            SDL_MixAudio(stream, sound->data + sound->curPos, remaning, SDL_MIX_MAXVOLUME);
            sound->curPos += remaning;
        }
    }
}

int main(int argc, char** argv) {
    SDL_Init(SDL_INIT_AUDIO);

    Uint8* soundData = nullptr;
    Uint32 soundLen = 0;

    SDL_AudioSpec soundSpec;
    if (!SDL_LoadWAV("assets/pickup.wav", &soundSpec, &soundData, &soundLen)) {
        SDL_Log("wav load failed: %s", SDL_GetError());
    }

    Sound sound;
    sound.data = soundData;
    sound.len = soundLen;
    sound.curPos = 0;

    soundSpec.userdata = &sound;
    soundSpec.callback = AudioCallback;

    SDL_OpenAudio(&soundSpec, nullptr);

    SDL_PauseAudio(SDL_FALSE);

    SDL_Delay(1500);

    SDL_CloseAudio();
    SDL_FreeWAV(soundData);

    SDL_Quit();
    return 0;
}
