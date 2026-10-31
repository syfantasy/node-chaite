export class ChannelStatistics {
    fromString(str) {
        const channel = JSON.parse(str);
        this.callTimes = channel.callTimes;
        this.useToken = channel.useToken;
        this.perModel = channel.perModel;
        return this;
    }
    toString() {
        return JSON.stringify(this);
    }
}
