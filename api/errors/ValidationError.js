class ValidationError extends Error {
	constructor(message, code) {
		super(message);
		this.code = code || 0;
		this.name = "ValidationError";
		this.msg = message;
	}
}
module.exports = ValidationError;
