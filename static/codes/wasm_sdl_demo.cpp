/*
 * compile:
 * em++ wasm_sdl_demo.cpp -s WASM=1 -s USE_SDL=2 -o index.html
 *
 * run:
 * emrun --port 8080 .
 */
#include "emscripten.h"

#include <SDL.h>
#include <cassert>
#include <iostream>

constexpr int WindowWidth = 400;
constexpr int WindowHeight = 100;

int x = 0;

SDL_Window* window = nullptr;
SDL_Renderer* render = nullptr;

void mainloop() {
    SDL_Event event;
    bool shouldQuit = false;
    while (SDL_PollEvent(&event)) {
        if (event.type == SDL_QUIT) {
            shouldQuit = true;
        }
    }

    SDL_SetRenderDrawColor(render, 0, 0, 0, 255);
    SDL_RenderClear(render);

    SDL_SetRenderDrawColor(render, 255, 0, 0, 255);
    SDL_Rect rect = {x, 0, 50, 50};
    if (x < WindowWidth) {
        x += 40;
    } else {
        x = 0;
    }
    SDL_RenderFillRect(render, &rect);
    SDL_RenderPresent(render);
}

int main(int argc, char** argv) {
    std::cout << "Hello Demo" << std::endl;
    SDL_Init(SDL_INIT_EVERYTHING);
    window = SDL_CreateWindow(
            "Demo",
            0, 0,
            WindowWidth, WindowHeight,
            0);
    assert(window);

    render = SDL_CreateRenderer(window, -1, 0);
    assert(render);

    emscripten_set_main_loop(mainloop, 60, 1);

    SDL_DestroyWindow(window);
    SDL_DestroyRenderer(render);
    SDL_Quit();
    return 0;
}
