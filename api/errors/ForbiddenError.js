class ForbiddenError extends Error {
	constructor(message, code) {
		super(message);
		this.code = code || 0;
		this.name = "ForbiddenError";
		this.msg = message;
	}
}
module.exports = ForbiddenError;
