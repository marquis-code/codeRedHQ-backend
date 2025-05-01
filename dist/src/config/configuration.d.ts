declare const _default: () => {
    port: number;
    database: {
        uri: string;
    };
    jwt: {
        secret: string;
        expiresIn: string;
    };
    cors: {
        origin: string;
    };
    google: {
        mapsApiKey: string;
    };
};
export default _default;
