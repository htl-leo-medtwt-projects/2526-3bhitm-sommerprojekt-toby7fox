-- ============================================================
--  Sport Tracker — Datenbankschema
--  Import in SQL Developer Data Modeler:
--  File → Data Modeler → Import → DDL File ...
--  Danach: Datei auswählen → Fertigstellen → ERD erscheint
-- ============================================================

CREATE TABLE `user` (
  `user_ID`         INT          AUTO_INCREMENT  NOT NULL,
  `username`        VARCHAR(255)                 NOT NULL,
  `password`        VARCHAR(255)                 NOT NULL,
  `bodyWeight`      FLOAT                        DEFAULT NULL,
  `profile_picture` VARCHAR(255)                 DEFAULT NULL,
  CONSTRAINT pk_user PRIMARY KEY (`user_ID`),
  CONSTRAINT uq_user_username UNIQUE (`username`)
);

-- --------------------------------------------------------

CREATE TABLE `sex` (
  `user_user_ID`    INT          NOT NULL,
  `sex`             ENUM('male','female')  NOT NULL,
  CONSTRAINT pk_sex PRIMARY KEY (`user_user_ID`),
  CONSTRAINT fk_sex_user
    FOREIGN KEY (`user_user_ID`)
    REFERENCES `user` (`user_ID`)
);

-- --------------------------------------------------------

CREATE TABLE `exercise` (
  `exercise_ID`     INT          AUTO_INCREMENT  NOT NULL,
  `exercise`        VARCHAR(255)                 NOT NULL,
  CONSTRAINT pk_exercise PRIMARY KEY (`exercise_ID`),
  CONSTRAINT uq_exercise_name UNIQUE (`exercise`)
);

-- --------------------------------------------------------

CREATE TABLE `Entry` (
  `Entry_ID`              INT    AUTO_INCREMENT  NOT NULL,
  `weight`                FLOAT                  NOT NULL,
  `reps`                  INT                    NOT NULL,
  `date`                  DATE                   NOT NULL,
  `bodyWeight`            FLOAT                  DEFAULT NULL,
  `user_user_ID`          INT                    NOT NULL,
  `exercise_exercise_ID`  INT                    NOT NULL,
  CONSTRAINT pk_entry PRIMARY KEY (`Entry_ID`),
  CONSTRAINT fk_entry_user
    FOREIGN KEY (`user_user_ID`)
    REFERENCES `user` (`user_ID`),
  CONSTRAINT fk_entry_exercise
    FOREIGN KEY (`exercise_exercise_ID`)
    REFERENCES `exercise` (`exercise_ID`)
);

-- --------------------------------------------------------

CREATE TABLE `activity` (
  `activity_ID`     INT          AUTO_INCREMENT  NOT NULL,
  `user_user_ID`    INT                          NOT NULL,
  `type`            ENUM('gym','bike','run','swim','ballsport')  NOT NULL,
  `date`            DATE                         NOT NULL,
  `sets`            INT                          NOT NULL  DEFAULT 0,
  `km`              FLOAT                        NOT NULL  DEFAULT 0,
  `hm`              FLOAT                        NOT NULL  DEFAULT 0,
  `meters`          INT                          NOT NULL  DEFAULT 0,
  `hours`           FLOAT                        NOT NULL  DEFAULT 0,
  `intense`         TINYINT(1)                   NOT NULL  DEFAULT 0,
  CONSTRAINT pk_activity PRIMARY KEY (`activity_ID`),
  CONSTRAINT fk_activity_user
    FOREIGN KEY (`user_user_ID`)
    REFERENCES `user` (`user_ID`)
);
