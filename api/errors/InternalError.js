class InternalError extends Error {
	constructor(message, code) {
		super(message);
		this.code = code || 0;
		this.name = "InternalError";
		this.msg = message;
	}
}
module.exports = InternalError;
