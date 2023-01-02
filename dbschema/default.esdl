module default {

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

        multi property emails -> str {
            constraint max_len_value(40);
        };
        multi property names -> str {
            constraint max_len_value(40);
        };
        multi property addresses -> str {
            constraint max_len_value(150);
        }

        multi link grants := User.<user[is Approvals];
        multi link clients := User.<owner[is Application];

        index on (.email);
    }

    type Application {
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
        multi link grants := Application.<client[is Approvals];

        index on (.client_id);
    }

    type Approvals {
        required link user -> User {
            on target delete delete source;
            readonly := true;
        };

        required link client -> Application{ 
            on target delete delete source;
            readonly := true;
        };
        
        multi property scopes -> str;
    }
}
