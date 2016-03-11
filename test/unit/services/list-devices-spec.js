var Cmbf = require('cmbf-core'),
    expect = require('chai').expect,
    sinon=require('sinon'),
    _=require('lodash'),
    handleCallback = require('./../../../../../node_modules/covistra-mongodb/node_modules/mongodb/lib/utils').handleCallback;


describe('Device list devices service',function(){
    var ctx;
    var stubBD;
    var spyFind;
    var spyLimitValid;
    var spyLimit;
    var spySkipValid;
    var spySkip;
    var filter={
        location:{
            latitude: 1,
            longitude: 2,
            radius: 10
        },
            country: ["canada"],
            language: ["fr","en"],
            account: ["this is the account"],
            user: ["this is the user"]
    };

    before(function(){
       return Cmbf.test_ctx.then(function (context) {
           ctx = context;
           return ctx;
       }).then(function(){
           var stubCursorValid= {
               limit:function(param){
                    return true
               },
               skip:function(){
                   return true
               },
               toArray:function(callback){
                   var item=[{_id:"This is the id of the device",uuid:"this is the uuid"}];
                   handleCallback(callback, null, item);
               }};
           var stubCursor= {
               limit:function(param){
                   return true
               },
               skip:function(){
                   return true
               },
               toArray:function(callback){
                   var item=[];
                   handleCallback(callback, null, item);
               }};
           spyLimitValid=sinon.spy(stubCursorValid,'limit');
           spyLimit=sinon.spy(stubCursor,'limit');
           spySkipValid=sinon.spy(stubCursorValid,'skip');
           spySkip=sinon.spy(stubCursor,'skip');
           var collection={
               find:function(searchParams){

                   if(_.keys(searchParams)==0){
                       return stubCursor

                   }else{
                       return stubCursorValid

                   }
               }
           };
           spyFind=sinon.spy(collection,'find');
           stubBD=sinon.stub(ctx.server.plugins['covistra-mongodb'].STABLE,'collection',function(){
               return collection;
           })
       })
    });

    it('should handle the error case if the limit is not a number',function(){
        var msg={role:'device', target: 'device', action:'list',limit:"test"};
        return ctx.server.service(msg).catch(function(err){
            expect(err.message).to.be.equal('seneca: Action action:list,role:device,target:device failed: child "limit" fails because ["limit" must be a number].');
        })
    });

    it('should handle the error case if the skip is not a number',function(){
        var msg={role:'device', target: 'device', action:'list',skip:"test"};
        return ctx.server.service(msg).catch(function(err){
            expect(err.message).to.be.equal('seneca: Action action:list,role:device,target:device failed: child "skip" fails because ["skip" must be a number].');
        })
    });

    it('should return an empty array if no parameter passed',function(){
        var msg={role:'device', target: 'device', action:'list'};
        return ctx.server.service(msg).then(function(result){
            expect(spyFind.lastCall.args[0]).to.be.deep.equal({});
            expect(result).to.be.a('array');
            expect(spyLimit.callCount).to.be.equal(1);
            expect(spyLimit.lastCall.args[0]).to.be.equal(1000);
            expect(spySkip.callCount).to.be.equal(0);
        })
    });

    it('should return an corresponding array is there is a filter complete',function(){
        var msg={role:'device', target: 'device', action:'list',filter:filter};
        return ctx.server.service(msg).then(function(result){
            //expect(spyFind.lastCall.args[0]).to.be.deep.equal({owner:{'$in':filter.account},userId:{'$in':filter.user}});
            expect(result).to.be.a('array');
            expect(result[0]).to.include.keys(["_id",'uuid','connected','last_seen','created_at']);
            expect(spyLimitValid.callCount).to.be.equal(1);
            expect(spyLimitValid.lastCall.args[0]).to.be.equal(1000);
            expect(spySkipValid.callCount).to.be.equal(0);
        })
    });
    it('should return an corresponding array is there is a filter with no account and no user',function(){
        var msg={role:'device', target: 'device', action:'list',filter:{
            location:{
                latitude: 1,
                longitude: 2,
                radius: 10
            },country: ["canada"],
            language: ["fr","en"]}};
        return ctx.server.service(msg).then(function(result){
            expect(spyFind.lastCall.args[0]).to.be.deep.equal({});
            expect(result).to.be.a('array');
            expect(spyLimit.callCount).to.be.equal(2);
            expect(spyLimit.lastCall.args[0]).to.be.equal(1000);
            expect(spySkip.callCount).to.be.equal(0);
        })
    });
    it('should return an corresponding array is there is a filter with an account and no user',function(){
        var msg={role:'device', target: 'device', action:'list',filter:{
            location:{
                latitude: 1,
                longitude: 2,
                radius: 10
            },country: ["canada"],
            language: ["fr","en"],
        account:["this is the account"]}};
        return ctx.server.service(msg).then(function(result){
            expect(spyFind.lastCall.args[0]).to.be.deep.equal({owner:{'$in':["this is the account"]}});
            expect(result).to.be.a('array');
            expect(spyLimitValid.callCount).to.be.equal(2);
            expect(spyLimitValid.lastCall.args[0]).to.be.equal(1000);
            expect(spySkipValid.callCount).to.be.equal(0);
        })
    });
    it('should call limit with the specify limit if no filter',function(){
        var msg={role:'device', target: 'device', action:'list',limit:10};
        return ctx.server.service(msg).then(function(result){
            expect(spyFind.lastCall.args[0]).to.be.deep.equal({});
            expect(result).to.be.a('array');
            expect(spyLimit.callCount).to.be.equal(3);
            expect(spyLimit.lastCall.args[0]).to.be.equal(msg.limit);
            expect(spySkip.callCount).to.be.equal(0);
        })
    });
    it('should call limit with the specify limit if a filter',function(){
        var msg={role:'device', target: 'device', action:'list',limit:10,filter:filter};
        return ctx.server.service(msg).then(function(result){
            //expect(spyFind.lastCall.args[0]).to.be.deep.equal({owner:{'$in':filter.account},userId:{'$in':filter.user}});
            expect(result).to.be.a('array');
            expect(spyLimitValid.callCount).to.be.equal(3);
            expect(spyLimitValid.lastCall.args[0]).to.be.equal(msg.limit);
            expect(spySkipValid.callCount).to.be.equal(0);
        })
    });
    it('should call skip with the specify skip if no filter',function(){
        //Note that the skip method was stub therefore the proper behavior if the skip is out of the boundry is not checked.
        var msg={role:'device', target: 'device', action:'list',skip:10};
        return ctx.server.service(msg).then(function(result){
            expect(spyFind.lastCall.args[0]).to.be.deep.equal({});
            expect(result).to.be.a('array');
            expect(spyLimit.callCount).to.be.equal(4);
            expect(spyLimit.lastCall.args[0]).to.be.equal(1000);
            expect(spySkip.callCount).to.be.equal(1);
        })
    });


    after(function(){
        spyFind.restore();
        stubBD.restore();
        spyLimit.restore();
        spyLimitValid.restore();
        spySkip.restore();
        spySkipValid.restore();
    })
});