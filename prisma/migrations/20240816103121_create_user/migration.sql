-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` VARCHAR(191) NOT NULL,
    `academy_id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `birth_date` DATETIME(3) NOT NULL,
    `user_name` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` ENUM('CHIEF', 'TEACHER', 'PARENT', 'STUDENT') NOT NULL DEFAULT 'STUDENT',

    UNIQUE INDEX `User_user_id_key`(`user_id`),
    UNIQUE INDEX `User_academy_id_key`(`academy_id`),
    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
