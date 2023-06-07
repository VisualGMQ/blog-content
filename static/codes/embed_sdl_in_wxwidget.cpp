#include "SDL.h"
#include <wx/wxprec.h>
#ifndef WX_PRECOMP
    #include <wx/wx.h>
#endif

SDL_Window* sdl_window;
SDL_Renderer* renderer;
SDL_Rect rect;
constexpr int WindowWidth = 480;
constexpr int WindowHeight = 320;


class MyCanva: public wxPanel {
public:
    MyCanva(wxFrame* parent): wxPanel(parent) {
        Bind(wxEVT_PAINT, &MyCanva::OnPaint, this);
        Bind(wxEVT_TIMER, &MyCanva::OnTimer, this);

        wxTimer* timer = new wxTimer(this);
        timer->Start(30);

        sdl_window = SDL_CreateWindowFrom(GetHandle());
        if (!sdl_window) {
            wxLogMessage("SDL window create failed: %s", SDL_GetError());
        } else {
            renderer = SDL_CreateRenderer(sdl_window, -1, 0);
            if (!renderer) {
                wxLogMessage("SDL renderer create failed: %s", SDL_GetError());
            }
            SDL_SetRenderDrawBlendMode(renderer, SDL_BLENDMODE_BLEND);
        }

        rect.x = 0;
        rect.y = 100;
        rect.w = rect.h = 10;
    }

private:
    void OnPaint(wxPaintEvent& event) {
        SDL_SetRenderDrawColor(renderer, 100, 100, 100, 255);
        SDL_RenderClear(renderer);
        SDL_SetRenderDrawColor(renderer, 255, 0, 0, 255);
        SDL_RenderFillRect(renderer, &rect);
        if (rect.x > WindowWidth) {
            rect.x = 0;
        }
        if (rect.x < 0) {
            rect.x = WindowWidth - rect.w;
        }
        SDL_RenderPresent(renderer);
    }

    void OnTimer(wxTimerEvent& event) {
        Refresh();
    }
};

class MyFrame: public wxFrame {
public:
    MyFrame(): wxFrame(nullptr, wxID_ANY, "Embed SDL in wxWidget", wxDefaultPosition, wxSize(WindowWidth, WindowHeight)) {
        MyCanva* canva = new MyCanva(this);
        wxButton* button1 = new wxButton(this, ID_LeftBtn, "move right", wxPoint(0, 0));
        Bind(wxEVT_BUTTON, [&](wxCommandEvent& e){
                    rect.x -= 10;
                }, ID_LeftBtn);

        wxButton* button2 = new wxButton(this, ID_RightBtn, "move right", wxPoint(100, 0));
        Bind(wxEVT_BUTTON, [&](wxCommandEvent& e){
                    rect.x += 10;
                }, ID_RightBtn);
    }

private:

    enum {
        ID_LeftBtn = 1,
        ID_RightBtn,
    };

};

class MyApp: public wxApp {
public:
    bool OnInit() override {
        SDL_Init(SDL_INIT_EVERYTHING);
        MyFrame* window = new MyFrame;
        window->Show();
        return true;
    }

    int OnExit() override {
        SDL_DestroyRenderer(renderer);
        SDL_Quit();
        return 0;
    }

private:
};


wxIMPLEMENT_APP(MyApp);
