import { format, formatDistanceToNow } from 'date-fns';

export const formatZulu = (dateOrString) => {
    if (!dateOrString) return '';
    try {
        const d = typeof dateOrString === 'string' ? new Date(dateOrString) : dateOrString;
        // Format to HH:MM:SSZ
        return format(d, "HH:mm:ss'Z'");
    } catch (e) {
        return '00:00:00Z';
    }
};

export const getZuluNow = () => {
    return formatZulu(new Date());
};

export const msToSeconds = (ms) => {
    return ms / 1000;
};

export const secondsToMs = (s) => {
    return s * 1000;
};

export const formatCountdown = (seconds) => {
    if (seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};
