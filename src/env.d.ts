/** Build-time public path (webpack DefinePlugin / CI PUBLIC_PATH). */
declare namespace NodeJS {
    interface ProcessEnv {
        PUBLIC_PATH?: string;
    }
}

declare const process: {
    env: {
        PUBLIC_PATH?: string;
        [key: string]: string | undefined;
    };
};
