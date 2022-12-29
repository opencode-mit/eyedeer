import { User } from "../Types";

const users: Array<User> = [
  { id: '1', username: 'bob', password: 'secret', name: 'Bob Smith' },
  { id: '2', username: 'joe', password: 'password', name: 'Joe Davis' },
];

export const findById = (id: string): User | undefined => {
    for (let i = 0, len = users.length; i < len; i++) {
        if (users[i]!.id === id) return users[i];;
    }
    return undefined;
};

export const findByUsername = (username: string): User | undefined => {
    for (let i = 0, len = users.length; i < len; i++) {
        if (users[i]!.username === username) return users[i];
    }
    return undefined;
};