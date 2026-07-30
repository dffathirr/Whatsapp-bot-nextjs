-- CreateTable
CREATE TABLE `reference` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `group` VARCHAR(50) NOT NULL,
    `description` TEXT NULL,

    UNIQUE INDEX `reference_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transactions` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `wallet_id` INTEGER UNSIGNED NOT NULL,
    `user_id` INTEGER UNSIGNED NOT NULL,
    `kd_type` VARCHAR(50) NOT NULL,
    `kd_category` VARCHAR(50) NOT NULL,
    `amount` DECIMAL(18, 2) NOT NULL,
    `description` TEXT NULL,
    `transfer_wallet` INTEGER UNSIGNED NULL,
    `transaction_date` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `soft_delete` BOOLEAN NOT NULL DEFAULT false,

    INDEX `transactions_wallet_id_idx`(`wallet_id`),
    INDEX `transactions_user_id_idx`(`user_id`),
    INDEX `transactions_kd_type_idx`(`kd_type`),
    INDEX `transactions_kd_category_idx`(`kd_category`),
    INDEX `transactions_transaction_date_idx`(`transaction_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `nik` VARCHAR(20) NULL,
    `currency` VARCHAR(10) NOT NULL DEFAULT 'IDR',

    UNIQUE INDEX `user_phone_key`(`phone`),
    UNIQUE INDEX `user_nik_key`(`nik`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wallet` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER UNSIGNED NOT NULL,
    `kd_type` VARCHAR(50) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `initial_balance` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `current_balance` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `wallet_user_id_idx`(`user_id`),
    INDEX `wallet_kd_type_idx`(`kd_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `whatsapp_session_keys` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `session_id` BIGINT NOT NULL,
    `keyType` VARCHAR(50) NOT NULL,
    `key_id` VARCHAR(255) NOT NULL,
    `value` JSON NOT NULL,
    `updated_date` DATETIME(3) NOT NULL,

    INDEX `whatsapp_session_keys_session_id_idx`(`session_id`),
    UNIQUE INDEX `whatsapp_session_keys_session_id_keyType_key_id_key`(`session_id`, `keyType`, `key_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `whatsapp_sessions` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `session_name` VARCHAR(100) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `creds` JSON NOT NULL,
    `created_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_date` DATETIME(3) NOT NULL,

    UNIQUE INDEX `whatsapp_sessions_session_name_key`(`session_name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_wallet_id_fkey` FOREIGN KEY (`wallet_id`) REFERENCES `wallet`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_transfer_wallet_fkey` FOREIGN KEY (`transfer_wallet`) REFERENCES `wallet`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_kd_type_fkey` FOREIGN KEY (`kd_type`) REFERENCES `reference`(`code`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_kd_category_fkey` FOREIGN KEY (`kd_category`) REFERENCES `reference`(`code`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wallet` ADD CONSTRAINT `wallet_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wallet` ADD CONSTRAINT `wallet_kd_type_fkey` FOREIGN KEY (`kd_type`) REFERENCES `reference`(`code`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `whatsapp_session_keys` ADD CONSTRAINT `whatsapp_session_keys_session_id_fkey` FOREIGN KEY (`session_id`) REFERENCES `whatsapp_sessions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
