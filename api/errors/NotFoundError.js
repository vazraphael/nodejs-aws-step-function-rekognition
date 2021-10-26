class NotFoundError extends Error {
	constructor(message) {
		super(message);
		this.name = "NotFoundError";
		this.msg = message;
	}
}
module.exports = NotFoundError;
