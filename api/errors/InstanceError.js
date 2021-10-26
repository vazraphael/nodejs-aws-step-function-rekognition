class InstanceError extends Error {
	constructor(message, code) {
		super(message);
		this.code = code || 0;
		this.name = "InstanceError";
		this.msg = message;
	}
}
module.exports = InstanceError;
