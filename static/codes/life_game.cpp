/*
生命游戏，网页版，基于SDL和WebAssembly
created by VisualGMQ

this game used SDL2 library to build, if you want to build this source code, please input below code in Bash:

em++ life_game.cpp -s WASM=1 -s USE_SDL=2 -o index.html

then use a server to run `index.html`, for example:
emrun --port 8080 .
*/

#include <iostream>
#include <cstdlib>
#include <vector>
#include <sstream>
#include "SDL.h"
#include "emscripten.h"
using namespace std;
using Map = vector<vector<bool>>;

const int Width = 600;
const int Height = 600;
int DelayTime = 100;
int cell_num = 40;
int cell_w = Width/cell_num;
int cell_h = Height/cell_num;
bool isstep = false;
int mx, my;
int button = 0;
bool isquit = false;
Map map;

void drawCell(SDL_Renderer* render, int x, int y, int r=255, int g=255, int b=255){
    SDL_SetRenderDrawColor(render, r, g, b, 255);
    SDL_Rect rect;
    rect.x = x;rect.y = y;rect.w = cell_w;rect.h = cell_h;
    SDL_RenderDrawRect(render, &rect);
}

void parserArgv(int argc, char** argv){
    stringstream ss;
    if(argc > 1){
        ss<<argv[1];
        ss>>cell_num;
    }
    ss.clear();
    if(argc > 2){
        ss<<argv[2];
        ss>>DelayTime;
    }
    cell_w = Width/cell_num;
    cell_h = Height/cell_num;
}

Map initMap(){
    Map map;
    for(int i=0;i<cell_num;i++){ vector<bool> inner(cell_num, false);
        map.push_back(inner);
    }
    return map;
}

void step(Map& map){
    Map tmp;
    tmp.assign(map.begin(), map.end());
    for(int col=0;col<cell_num;col++)
        for(int row=0;row<cell_num;row++){
            int count = 0;
            for(int i=-1;i<=1;i++){
                for(int j=-1;j<=1;j++){
                    bool isnearly = !(i==0 && j==0);
                    bool isinmap = col+i>=0 && col+i<cell_num && row+j>=0 && row+j<cell_num;
                    if(isinmap && isnearly)
                        if(map[col+i][row+j]){
                            count++;
                        }
                }
            }
            if(count == 3){
                tmp[col][row] = true;
            }else if(count != 2){
                tmp[col][row] = false;
            }
        }
    map.assign(tmp.begin(), tmp.end());
}

void drawMap(Map& map, SDL_Renderer* render){
    for(int i=0;i<map.size();i++)
        for(int j=0;j<map[0].size();j++)
            if(map[i][j])
                drawCell(render, cell_w*i, cell_h*j);
}

Map init(int argc, char** argv){
    parserArgv(argc, argv);
    Map map;
    map = initMap();
    return map;
}

void setLife(SDL_Renderer* render,Map& map, int mx, int my, int pressed){
    int col = mx/cell_w,
        row = my/cell_h;
    drawCell(render, col * cell_w, row * cell_h, 0, 255, 0);
    if(pressed == 1)
        map[col][row] = true;
    if(pressed == -1)
        map[col][row] = false;
}


void drawCursor(SDL_Renderer* render,const int& mx,const int& my){
    SDL_SetRenderDrawColor(render, 255, 0, 0, 255);
    SDL_RenderDrawLine(render, mx-5, my, mx+5, my);
    SDL_RenderDrawLine(render, mx, my-5, mx, my+5);
}

void mainloop(void* arg) {
    SDL_Event event;
    SDL_Renderer* render = static_cast<SDL_Renderer*>(arg);
    SDL_SetRenderDrawColor(render, 0, 0, 0, 255);
    SDL_RenderClear(render);
    while(SDL_PollEvent(&event)){
        if(event.type == SDL_QUIT)
            isquit = true;
        if(event.type == SDL_MOUSEMOTION){
            mx = event.button.x;
            my = event.button.y;
        }
        if(!isstep){
            if(event.type == SDL_MOUSEBUTTONDOWN){
                if(event.button.button == SDL_BUTTON_LEFT)
                    button = 1;
                if(event.button.button == SDL_BUTTON_RIGHT)
                    button = -1;
            }
            if(event.type == SDL_MOUSEBUTTONUP)
                button = 0;
        }
        if(event.type == SDL_KEYDOWN){
            if(event.key.keysym.sym == SDLK_SPACE)
                isstep = !isstep;
            if(event.key.keysym.sym == SDLK_q || event.key.keysym.sym == SDLK_ESCAPE)
                isquit = true;
            if(event.key.keysym.sym == SDLK_c)
                for(int i=0;i<map.size();i++)
                    for(int j=0;j<map[i].size();j++)
                        map[i][j] = false;
        }
    }
    if(button == 1)
        setLife(render, map, mx, my, 1);
    if(button == -1)
        setLife(render, map, mx, my, -1);

    drawMap(map, render);
    if(isstep)
        step(map);
    else 
        setLife(render, map, mx, my, 0);
    drawCursor(render, mx, my);
    SDL_RenderPresent(render);
    if (isstep) {
        SDL_Delay(DelayTime);
    }
}

void PrintHelpInfo() {
    std::string msg = R""(
康威的生命游戏
操作说明：
    鼠标左键：放置细胞
    鼠标右键：删除细胞
    c：清屏
    空格： 开始/暂停模拟
    )"";

    std::cout << msg;
}

int main(int argc, char** argv){
    PrintHelpInfo();
    map = init(argc, argv);
    SDL_Init(SDL_INIT_EVERYTHING);
    SDL_Window* window = SDL_CreateWindow("life game", 0, 0, Width, Height, 0);
    SDL_assert(window != nullptr);
    SDL_Renderer* render =  SDL_CreateRenderer(window, -1, 0);
    SDL_assert(render != nullptr);
    SDL_ShowCursor(SDL_FALSE);

    emscripten_set_main_loop_arg(mainloop, render, -1, 1);

    SDL_ShowCursor(SDL_TRUE);
    SDL_DestroyWindow(window);
    SDL_DestroyRenderer(render);
    SDL_Quit();
    return 0;
}
