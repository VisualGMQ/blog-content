type
  Bresenham* = object
    p1, p2: tuple[x: int, y: int]
    dx, dy: int
    sx, sy: int
    err: int

proc createBresenham*(x1,y1,x2,y2: int): Bresenham =
  result = Bresenham(
    p1: (x: x1, y: y1),
    p2: (x: x2, y: y2),
    dx: 2 * abs(x1 - x2),
    dy: 2 * abs(y1 - y2),
    sx: if x1 < x2: 1 elif x1 > x2: -1 else: 0,
    sy: if y1 < y2: 1 elif y1 > y2: -1 else: 0,
    )
  result.err = if result.dx >= result.dy:
                -result.dx div 2
               else:
                -result.dy div 2
                

method `curPoint`*(self: Bresenham): tuple[x: int, y: int] {. base, inline .} = self.p1
method isFinish*(self: Bresenham): bool {. base, inline .} = self.p2 == self.p1

method step*(self: var Bresenham) {. base .} =
  if not self.isFinish():
    if self.dx >= self.dy:
      self.p1.x += self.sx
      self.err += self.dy
      if self.err >= 0:
        self.p1.y += self.sy
        self.err -= self.dx
    else:
      self.p1.y += self.sy
      self.err += self.dx
      if self.err >= 0:
        self.p1.x += self.sx
        self.err -= self.dy