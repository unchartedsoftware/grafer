import {message} from '../src/mod';

describe('mod spec example', function () {
    it('Exports the correct message', function () {
        chai.expect(message).to.equal('Howdy Worlds!');
    });
});
