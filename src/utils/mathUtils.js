export const getDistance = (x1, y1, x2, y2) => {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
};

export const getBearing = (x1, y1, x2, y2) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    let angle = Math.atan2(dy, dx) * (180 / Math.PI);
    // Convert math angle to navigation bearing (0 is North)
    let bearing = angle + 90;
    if (bearing < 0) bearing += 360;
    return bearing;
};

export const getAngleDeg = (x1, y1, x2, y2) => {
    return Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
};

export const normalizeAngle = (deg) => {
    let angle = deg % 360;
    if (angle < 0) angle += 360;
    return angle;
};

export const lerp = (a, b, t) => {
    return a + (b - a) * t;
};

export const clamp = (val, min, max) => {
    return Math.max(min, Math.min(val, max));
};

export const randomBetween = (min, max) => {
    return Math.random() * (max - min) + min;
};

export const randomSign = () => {
    return Math.random() > 0.5 ? 1 : -1;
};

export const degreesToRadians = (deg) => {
    return deg * (Math.PI / 180);
};

export const radiansToDegrees = (rad) => {
    return rad * (180 / Math.PI);
};
