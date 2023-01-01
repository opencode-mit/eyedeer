CREATE MIGRATION m1l66b6zs3y6tn7bpvhiuyhflq2xnolkmtewfo4mblmfju7gdupqxq
    ONTO initial
{
  CREATE FUTURE nonrecursive_access_policies;
  CREATE ABSTRACT TYPE default::ProfileInfo {
      CREATE REQUIRED PROPERTY info_name -> std::str;
  };
  CREATE TYPE default::Address EXTENDING default::ProfileInfo {
      CREATE REQUIRED PROPERTY address -> std::str;
  };
  CREATE TYPE default::Approvals {
      CREATE MULTI PROPERTY scopes -> std::str;
  };
  CREATE TYPE default::Client {
      CREATE REQUIRED PROPERTY client_id -> std::str {
          SET readonly := true;
          CREATE CONSTRAINT std::exclusive;
          CREATE CONSTRAINT std::max_len_value(20);
          CREATE CONSTRAINT std::min_len_value(20);
      };
      CREATE INDEX ON (.client_id);
      CREATE REQUIRED PROPERTY client_secret -> std::str {
          CREATE CONSTRAINT std::max_len_value(40);
          CREATE CONSTRAINT std::min_len_value(40);
      };
      CREATE PROPERTY image -> std::bytes;
      CREATE REQUIRED PROPERTY name -> std::str {
          CREATE CONSTRAINT std::max_len_value(40);
      };
      CREATE REQUIRED PROPERTY redirect_uri -> std::str {
          CREATE CONSTRAINT std::max_len_value(60);
      };
  };
  ALTER TYPE default::Approvals {
      CREATE REQUIRED LINK client -> default::Client {
          ON TARGET DELETE DELETE SOURCE;
          SET readonly := true;
      };
  };
  ALTER TYPE default::Client {
      CREATE MULTI LINK grants := (default::Client.<client[IS default::Approvals]);
  };
  CREATE TYPE default::User {
      CREATE MULTI LINK profile -> default::ProfileInfo {
          ON SOURCE DELETE DELETE TARGET;
      };
      CREATE REQUIRED PROPERTY email -> std::str {
          CREATE CONSTRAINT std::exclusive;
          CREATE CONSTRAINT std::max_len_value(40);
      };
      CREATE INDEX ON (.email);
      CREATE REQUIRED PROPERTY hash -> std::str {
          CREATE CONSTRAINT std::max_len_value(60);
          CREATE CONSTRAINT std::min_len_value(60);
      };
      CREATE REQUIRED PROPERTY verified -> std::bool;
  };
  ALTER TYPE default::Approvals {
      CREATE REQUIRED LINK user -> default::User {
          ON TARGET DELETE DELETE SOURCE;
          SET readonly := true;
      };
  };
  ALTER TYPE default::User {
      CREATE MULTI LINK grants := (default::User.<user[IS default::Approvals]);
  };
  ALTER TYPE default::Client {
      CREATE REQUIRED LINK owner -> default::User {
          ON TARGET DELETE DELETE SOURCE;
          SET readonly := true;
      };
  };
  ALTER TYPE default::User {
      CREATE MULTI LINK clients := (default::User.<owner[IS default::Client]);
  };
  CREATE TYPE default::Email EXTENDING default::ProfileInfo {
      CREATE REQUIRED PROPERTY email -> std::str;
  };
  CREATE TYPE default::Name EXTENDING default::ProfileInfo {
      CREATE REQUIRED PROPERTY name -> std::str;
  };
};
