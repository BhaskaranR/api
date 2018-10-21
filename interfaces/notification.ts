export interface  Notification {
    title: string;
    body: string;
    dir: string;
    tag: string;
    renotify: boolean;
    vibrate: number[]
}