import { Client } from "../Types";

const clients: Array<Client> = [
    { id: '1', name: 'Samplr', clientId: 'abc123', clientSecret: 'ssh-secret', redirect_uri: 'http://localhost:8888/callback', image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAMAAADXqc3KAAAAh1BMVEUAAAAxd71AfcQxd70yhsUyeL4xeL4zfsMxeL0yeL4xeL4wesExfcQxeb4xeb4yeb8xeL4xecAxeL4xeL0xeL4xeL4xeb8xesAxeMAwe8UxeL4yeb8xer8yeb8yeb4ye8Eyeb8yeb8xesAxeMIxeL4yeb0xd7wzfcYze8M0f8kyecAxeL41gs16QFhpAAAAJnRSTlMA+wP4CNhaEfLdwh8L76ed6zvl1My7ajIpGeCVhGRRIrV3RTZ9ZT8pRf8AAAE9SURBVCjPTZHZmoMgDEaBMO5bW221+zJDCPT9n28CeOG50pyE/HwIRgmR37pDAefpd46/TKof90jWe4cElzyaWG+e5CAipaf9LhkldPUF4GYia4wBhNM60xEgtVV36Q/WB3POY/1uHY7Z0oTpG3hpgC5RVN99JsR1FiqkQGmkL2qu775jLeq2E1opLZrSsqEji/6gxDwg96wLw1l9EItQfNrfPQvcpzCBFQtuzQiMxYTjxNKd00WmsDFdEGTADLG+DE4auwUhipPk6fJnQzlGsfPGF7NqdKLRTaOj+PCAffPHhigehYMQUKuAVqGWqFBK7LVYqV/5OnIjXo8/r91jqU9ZX7QsEiMCryFXtIVBwjKIFBgsG2mcc16CTyIlbokFE16X2nyTrHOEzjuLZMvjNrP4XKdyGA7P6zvF+wdaYR+WPYBj2gAAAABJRU5ErkJggg==' },
    { id: '2', name: 'Samplr2', clientId: 'xyz123', clientSecret: 'ssh-password', redirect_uri: 'https://google.com', image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAMAAADXqc3KAAAB+FBMVEUAAAA/mUPidDHiLi5Cn0XkNTPmeUrkdUg/m0Q0pEfcpSbwaVdKskg+lUP4zA/iLi3msSHkOjVAmETdJSjtYFE/lkPnRj3sWUs8kkLeqCVIq0fxvhXqUkbVmSjwa1n1yBLepyX1xxP0xRXqUkboST9KukpHpUbuvRrzrhF/ljbwaljuZFM4jELaoSdLtElJrUj1xxP6zwzfqSU4i0HYnydMtUlIqUfywxb60AxZqEXaoifgMCXptR9MtklHpEY2iUHWnSjvvRr70QujkC+pUC/90glMuEnlOjVMt0j70QriLS1LtEnnRj3qUUXfIidOjsxAhcZFo0bjNDH0xxNLr0dIrUdmntVTkMoyfL8jcLBRuErhJyrgKyb4zA/5zg3tYFBBmUTmQTnhMinruBzvvhnxwxZ/st+Ktt5zp9hqota2vtK6y9FemNBblc9HiMiTtMbFtsM6gcPV2r6dwroseLrMrbQrdLGdyKoobKbo3Zh+ynrgVllZulTsXE3rV0pIqUf42UVUo0JyjEHoS0HmsiHRGR/lmRz/1hjqnxjvpRWfwtOhusaz0LRGf7FEfbDVmqHXlJeW0pbXq5bec3fX0nTnzmuJuWvhoFFhm0FtrziBsjaAaDCYWC+uSi6jQS3FsSfLJiTirCOkuCG1KiG+wSC+GBvgyhTszQ64Z77KAAAARXRSTlMAIQRDLyUgCwsE6ebm5ubg2dLR0byXl4FDQzU1NDEuLSUgC+vr6urq6ubb29vb2tra2tG8vLu7u7uXl5eXgYGBgYGBLiUALabIAAABsElEQVQoz12S9VPjQBxHt8VaOA6HE+AOzv1wd7pJk5I2adpCC7RUcHd3d3fXf5PvLkxheD++z+yb7GSRlwD/+Hj/APQCZWxM5M+goF+RMbHK594v+tPoiN1uHxkt+xzt9+R9wnRTZZQpXQ0T5uP1IQxToyOAZiQu5HEpjeA4SWIoksRxNiGC1tRZJ4LNxgHgnU5nJZBDvuDdl8lzQRBsQ+s9PZt7s7Pz8wsL39/DkIfZ4xlB2Gqsq62ta9oxVlVrNZpihFRpGO9fzQw1ms0NDWZz07iGkJmIFH8xxkc3a/WWlubmFkv9AB2SEpDvKxbjidN2faseaNV3zoHXvv7wMODJdkOHAegweAfFPx4G67KluxzottCU9n8CUqXzcIQdXOytAHqXxomvykhEKN9EFutG22p//0rbNvHVxiJywa8yS2KDfV1dfbu31H8jF1RHiTKtWYeHxUvq3bn0pyjCRaiRU6aDO+gb3aEfEeVNsDgm8zzLy9egPa7Qt8TSJdwhjplk06HH43ZNJ3s91KKCHQ5x4sw1fRGYDZ0n1L4FKb9/BP5JLYxToheoFCVxz57PPS8UhhEpLBVeAAAAAElFTkSuQmCC' },
];
  
export function findById (id: string): Client | undefined {
    for (let i = 0, len = clients.length; i < len; i++) {
        if (clients[i]!.id === id) return clients[i];
    }
    return undefined;
};

export function findByClientId (clientId: string): Client | undefined {
    for (let i = 0, len = clients.length; i < len; i++) {
        if (clients[i]!.clientId === clientId) return clients[i];
    }
    return undefined;
};
