module default {
    abstract type ProfileInfo {
        required property info_name -> str;
    }

    type Name extending ProfileInfo {
        required property name -> str;
    }

    type Email extending ProfileInfo {
        required property email -> str;
    }

    type Address extending ProfileInfo {
        required property address -> str;
    }

    type User {
        required property email -> str {
            constraint exclusive;
            constraint max_len_value(40);
        };

        required property hash -> str {
            constraint min_len_value(60);
            constraint max_len_value(60);
        };

        required property verified -> bool;

        multi link profile -> ProfileInfo {
            on source delete delete target;
        };

        multi link grants := User.<user[IS Approvals];
        multi link clients := User.<owner[IS Client];

        index on (.email);
    }

    type Client {
        required link owner -> User {
            on target delete delete source;
            readonly := true;
        };

        required property name -> str {
            constraint max_len_value(40);
        };

        required property client_id -> str {
            constraint exclusive;
            constraint min_len_value(20);
            constraint max_len_value(20);
            readonly := true;
        };

        required property client_secret -> str {
            constraint min_len_value(40);
            constraint max_len_value(40);
        };

        required property redirect_uri -> str {
            constraint max_len_value(60);
        }

        property image -> bytes;
        multi link grants := Client.<client[IS Approvals];

        index on (.client_id);
    }

    type Approvals {
        required link user -> User {
            on target delete delete source;
            readonly := true;
        };

        required link client -> Client{ 
            on target delete delete source;
            readonly := true;
        };
        
        multi property scopes -> str;
    }
}
