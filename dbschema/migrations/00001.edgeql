CREATE MIGRATION m1bpsgc7ifm7kwacx2e3ernzlmm6rb6mbxhodno5udf7vno66utlpq
    ONTO initial
{
  CREATE FUTURE nonrecursive_access_policies;
  CREATE TYPE default::Application {
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
  CREATE TYPE default::Approval {
      CREATE LINK client -> default::Application {
          ON TARGET DELETE DELETE SOURCE;
          SET readonly := true;
      };
      CREATE MULTI PROPERTY scopes -> std::str;
  };
  ALTER TYPE default::Application {
      CREATE MULTI LINK grants := (default::Application.<client[IS default::Approval]);
  };
  CREATE TYPE default::User {
      CREATE REQUIRED PROPERTY email -> std::str {
          CREATE CONSTRAINT std::exclusive;
          CREATE CONSTRAINT std::max_len_value(40);
      };
      CREATE INDEX ON (.email);
      CREATE MULTI PROPERTY addresses -> std::str {
          CREATE CONSTRAINT std::max_len_value(150);
      };
      CREATE MULTI PROPERTY emails -> std::str {
          CREATE CONSTRAINT std::max_len_value(40);
      };
      CREATE REQUIRED PROPERTY hash -> std::str {
          CREATE CONSTRAINT std::max_len_value(60);
          CREATE CONSTRAINT std::min_len_value(60);
      };
      CREATE MULTI PROPERTY names -> std::str {
          CREATE CONSTRAINT std::max_len_value(40);
      };
      CREATE REQUIRED PROPERTY verified -> std::bool;
  };
  ALTER TYPE default::Application {
      CREATE REQUIRED LINK owner -> default::User {
          ON TARGET DELETE DELETE SOURCE;
          SET readonly := true;
      };
  };
  ALTER TYPE default::User {
      CREATE MULTI LINK clients := (default::User.<owner[IS default::Application]);
  };
  ALTER TYPE default::Approval {
      CREATE LINK user -> default::User {
          ON TARGET DELETE DELETE SOURCE;
          SET readonly := true;
      };
  };
  ALTER TYPE default::User {
      CREATE MULTI LINK grants := (default::User.<user[IS default::Approval]);
  };
};
