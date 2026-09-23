class appError extends Error {

    constructor(message, statusCode, statusText) {

        super(message);

        this.statusCode = statusCode;
        this.statusText = statusText;
    }
}

module.exports = {
    create: (message, statusCode, statusText) => {
        return new appError(message, statusCode, statusText);
    }
};
