import crypto from 'crypto';
import jdenticon from 'jdenticon';
import { createCanvas } from 'canvas';
export const getUid = (length: number): string => {
    return crypto.randomBytes(length / 2).toString('hex');
};

const mapping = new Map<string, string>([
    ['email', 'personal'],
    ['name', 'personal'],
    ['address', 'location']
]);

export const formatScopes = (scopes: Set<string>) => {
    const result = new Map<string, Array<string>>();
    for (const scope of scopes) {
        const arr = result.get(mapping.get(scope)!);
        if (arr === undefined) {
            result.set(mapping.get(scope)!, [scope]);
        } else {
            arr.push(scope);
        }
    }
    return Object.fromEntries(result);
}

export const inFirstNotInSecond = (first: Set<any>, second: Set<any>): Set<any> => {
    const result = new Set<any>();
    for (const element of first) {
        if (!second.has(element)) result.add(element);
    }
    return result;
}

export const enumFromValue = <T extends Record<string, string>>(val: string, _enum: T) => {
    const enumName = (Object.keys(_enum) as Array<keyof T>).find(k => _enum[k] === val)
    if (!enumName) return undefined;
    return _enum[enumName]
}

export async function getProfilePicture(id: string) {
    const image = jdenticon.toPng(id, 200);
    const blob = new Blob([image], {type: 'image/png'});
    const arrayBuffer = await blob.arrayBuffer();
    return new Uint8Array(arrayBuffer);
}
  