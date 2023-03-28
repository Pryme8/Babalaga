type Vector2 = { x: number, y: number }
export interface OverlappingRectangles {
    position: Vector2
    size: Vector2
}
export const AreRectanglesOverlapping = (rect1: OverlappingRectangles, rect2: OverlappingRectangles): boolean =>{
    const rect1Left = rect1.position.x - (rect1.size.x * 0.5)
    const rect1Right = rect1.position.x + rect1.size.x
    const rect1Top = rect1.position.y + (rect1.size.y * 0.5)
    const rect1Bottom = rect1.position.y - rect1.size.y

    const rect2Left = rect2.position.x - (rect2.size.x * 0.5)
    const rect2Right = rect2.position.x + rect2.size.x
    const rect2Top = rect2.position.y + (rect2.size.y * 0.5)
    const rect2Bottom = rect2.position.y - rect2.size.y

    return (
        (rect1Top >= rect2Bottom &&
        rect1Bottom <= rect2Top) &&
        (rect1Left <= rect2Right &&
        rect1Right >= rect2Left)
    )
}


