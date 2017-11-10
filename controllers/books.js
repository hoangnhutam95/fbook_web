var express = require('express');
var router = express.Router();
var request = require('request');
var util = require('util');
var async = require('async');
var objectHeaders = require('../helpers/headers');
var localSession = require('../middlewares/localSession');
var authorize = require('../middlewares/authorize');

router.get('/', localSession, function (req, res, next) {
    req.checkQuery('field', 'Invalid field').notEmpty().isAlpha();

    req.getValidationResult().then(function (result) {
        if (!result.isEmpty()) {
            res.status(400).send('There have been validation errors: ' + util.inspect(result.array()));
            return;
        } else {
            var page = req.query.page ? req.query.page : 1;
            var field = req.query.field;
            var url = req.configs.api_base_url + 'books/?field=' + field + '&page=' + page;

            if (req.query.officeId) {
                url += '&office_id=' + req.query.officeId;
            }

            async.parallel({
                section: function (callback) {
                    request({
                        url: url,
                        headers: objectHeaders.headers
                    }, function (error, response, body) {
                        if (!error && response.statusCode === 200) {
                            try {
                                var section = JSON.parse(body);
                                callback(null, section);
                            } catch (errorJSONParse) {
                                callback(null, null);
                            }
                        } else {
                            callback(null, null);
                        }
                    });
                },
                categories: function (callback) {
                    request({
                        url: req.configs.api_base_url + 'categories',
                        headers: objectHeaders.headers
                    }, function (error, response, body) {
                        if (!error && response.statusCode === 200) {
                            try {
                                var categories = JSON.parse(body);
                                callback(null, categories);
                            } catch (errorJSONParse) {
                                callback(null, null);
                            }
                        } else {
                            callback(null, null);
                        }
                    });
                },
                sortBookBy: function (callback) {
                    request({
                        url: req.configs.api_base_url + 'books/sort-by',
                        headers: objectHeaders.headers
                    }, function (error, response, body) {
                        if (!error && response.statusCode === 200) {
                            try {
                                var sortBookBy = JSON.parse(body);
                                callback(null, sortBookBy);
                            } catch (errorJSONParse) {
                                callback(null, null);
                            }
                        } else {
                            callback(null, null);
                        }
                    });
                }
            }, function (err, results) {
                if (err) {
                    res.status(400).send(err);
                } else {
                    res.render('books/section', {
                        field: field,
                        officeId: req.query.officeId,
                        section: results.section,
                        categories: results.categories,
                        sortBookBy: results.sortBookBy,
                        error: req.flash('error'),
                        info: req.flash('info')
                    });
                }
            });
        }
    });
});

router.get('/add', authorize.isAuthenticated, function (req, res, next) {
    async.parallel({
        offices: function (callback) {
            request({
                url: req.configs.api_base_url + 'offices',
                headers: objectHeaders.headers
            }, function (error, response, body) {
                if (!error && response.statusCode === 200) {
                    try {
                        var offices = JSON.parse(body);
                        callback(null, offices);
                    } catch (errorJSONParse) {
                        callback(null, null);
                    }
                } else {
                    callback(null, null);
                }
            });
        },
        categories: function (callback) {
            request({
                url: req.configs.api_base_url + 'categories',
                headers: objectHeaders.headers
            }, function (error, response, body) {
                if (!error && response.statusCode === 200) {
                    try {
                        var categories = JSON.parse(body);
                        callback(null, categories);
                    } catch (errorJSONParse) {
                        callback(null, null);
                    }
                } else {
                    callback(null, null);
                }
            });
        }
    }, function (err, results) {
        if (err) {
            res.redirect('back');
        } else {
            res.render('books/add', {
                categories: results.categories,
                offices: results.offices,
                officeId: req.session.office_id
            });
        }
    });
});

router.get('/waiting_approve', authorize.isAuthenticated, function (req, res, next) {
    request({
        url: req.configs.api_base_url + 'user/books/waiting_approve',
        headers: objectHeaders.headers({'Authorization': req.session.access_token})
    }, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            try {
                var books = JSON.parse(body);
                res.render('books/waiting_approve', {
                    books: books,
                    pageTitle: 'Home',
                    info: req.flash('info'),
                    error: req.flash('error'),
                });
            } catch (errorJSONParse) {
                res.redirect('home');
            }
        } else {
            res.redirect('home');
        }
    });
});

router.get('/:id/approve-request', authorize.isAuthenticated, function (req, res, next) {
    req.checkParams('id', 'Invalid id').notEmpty().isInt();
    req.getValidationResult().then(function (result) {
        if (!result.isEmpty()) {
            res.status(400).send('There have been validation errors: ' + util.inspect(result.array()));
            return;
        } else {
            request({
                url: req.configs.api_base_url + 'user/' + req.params.id + '/approve/detail',
                headers: objectHeaders.headers({'Authorization': req.session.access_token})
            }, function (error, response, body) {
                if (!error && response.statusCode === 200) {
                    try {
                        var data = JSON.parse(body);

                        res.render('books/approve_user', {
                            data: data,
                            pageTitle: 'Approve requests'
                        });
                    } catch (errorJSONParse) {
                        req.flash('error', 'Don\'t allow show approve request page');
                        res.redirect('back');
                    }
                } else {
                    req.flash('error', 'Don\'t allow show approve request page');
                    res.redirect('back');
                }
            });
        }
    });
});

router.get('/:id', localSession, function (req, res, next) {
    req.checkParams('id', 'Invalid id').notEmpty().isInt();
    req.getValidationResult().then(function (result) {
        if (!result.isEmpty()) {
            res.status(400).send('There have been validation errors: ' + util.inspect(result.array()));
            return;
        } else {
            if (typeof req.session.book_detail_key === 'undefined') {
                request({
                    url: req.configs.api_base_url + 'books/' + req.params.id + '/increase-view',
                    headers: objectHeaders.headers
                }, function (error, response, body) {
                    if (!error && response.statusCode === 200) {
                        try {
                            req.session.book_detail_key = Math.random().toString(36).substring(7);
                            res.redirect(req.params.id);
                        } catch (errorJSONParse) {
                            res.redirect('back');
                        }
                    } else {
                        res.redirect('back');
                    }
                });
            } else {
                request({
                    url: req.configs.api_base_url + 'books/' + req.params.id,
                    headers: objectHeaders.headers
                }, function (error, response, body) {
                    if (!error && response.statusCode === 200) {
                        try {
                            var data = JSON.parse(body);
                            var currentUserReview = null;
                            var returnBookForOwner = null;
                            var cancelBookForOwner = null;
                            var returningBookToOwner = null;
                            var messages = req.flash('errors');
                            var btnBooking = {
                                'text': 'Want to Read',
                                'status': req.configs.book_user.status.waiting
                            };
                            if (typeof req.session.user !== 'undefined') {
                                if (data.item.reviews_detail.length > 0) {
                                    data.item.reviews_detail.forEach (function (review) {
                                        if (review.user.id === req.session.user.id) {
                                            currentUserReview = review;
                                            return;
                                        }
                                    });
                                }
                                if (data.item.users_reading) {
                                    data.item.users_reading.forEach (function (userReading) {
                                        data.item.owners.forEach (function (owner) {
                                            if (userReading.id === req.session.user.id) {
                                                btnBooking = {
                                                    'text': 'Want to Return',
                                                    'status': req.configs.book_user.status.returning
                                                };
                                                if (userReading.owner_id === owner.id) {
                                                    returnBookForOwner = owner;
                                                }
                                                return;
                                            }
                                        });
                                    });
                                }
                                if (data.item.users_waiting) {
                                    data.item.users_waiting.forEach (function (userWaiting) {
                                        data.item.owners.forEach (function (owner) {
                                            if (userWaiting.id === req.session.user.id) {
                                                btnBooking = {
                                                    'text': 'Cancel waiting this book',
                                                    'status': req.configs.book_user.status.cancel_waiting
                                                };
                                                if (userWaiting.owner_id === owner.id) {
                                                    cancelBookForOwner = owner;
                                                }
                                                return;
                                            }
                                        });
                                    });
                                }
                                if (data.item.users_returning) {
                                    data.item.users_returning.forEach (function (userReturning) {
                                        data.item.owners.forEach (function (owner) {
                                            if (userReturning.id === req.session.user.id) {
                                                btnBooking = {
                                                    'text': 'You are returning this book',
                                                    'status': req.configs.book_user.status.returned
                                                };
                                                if (userReturning.owner_id === owner.id) {
                                                    returningBookToOwner = owner;
                                                }
                                                return;
                                            }
                                        });
                                    });
                                }
                            }

                            data.item.btn_booking = btnBooking;
                            data.item.current_user_review = currentUserReview;
                            data.item.return_book_for_owner = returnBookForOwner;
                            data.item.cancel_book_for_owner = cancelBookForOwner;
                            data.item.returning_book_to_owner = returningBookToOwner;

                            res.render('books/detail', {
                                data: data,
                                pageTitle: 'Detail',
                                officeId: data.item.office.id,
                                messages: messages,
                                error: req.flash('error'),
                                info: req.flash('info')
                            });
                        } catch (errorJSONParse) {
                            req.flash('error', 'Don\'t allow show this book');
                            res.redirect('back');
                        }
                    } else {
                        req.flash('error', 'Don\'t allow show this book');
                        res.redirect('back');
                    }
                });
            }
        }
    });
});

router.get('/category/:category_id', localSession, function (req, res, next) {
    req.checkParams('category_id', 'Invalid category').notEmpty().isInt();

    var page = req.query.page ? req.query.page : 1;
    req.getValidationResult().then(function (result) {
        if (!result.isEmpty()) {
            res.status(400).send('There have been validation errors: ' + util.inspect(result.array()));
            return;
        } else {
            async.parallel({
                books: function (callback) {
                    request({
                        url: req.configs.api_base_url + 'books/category/' + req.params.category_id + '/?page=' + page,
                        headers: objectHeaders.headers
                    }, function (error, response, body) {
                        if (!error && response.statusCode === 200) {
                            try {
                                var books = JSON.parse(body);
                                callback(null, books);
                            } catch (errorJSONParse) {
                                callback(null, null);
                            }
                        } else {
                            callback(null, null);
                        }
                    });
                },
                categories: function (callback) {
                    request({
                        url: req.configs.api_base_url + 'categories',
                        headers: objectHeaders.headers
                    }, function (error, response, body) {
                        if (!error && response.statusCode === 200) {
                            try {
                                var categories = JSON.parse(body);
                                callback(null, categories);
                            } catch (errorJSONParse) {
                                callback(null, null);
                            }
                        } else {
                            callback(null, null);
                        }
                    });
                },
                sortBookBy: function (callback) {
                    request({
                        url: req.configs.api_base_url + 'books/sort-by',
                        headers: objectHeaders.headers
                    }, function (error, response, body) {
                        if (!error && response.statusCode === 200) {
                            try {
                                var sortBookBy = JSON.parse(body);
                                callback(null, sortBookBy);
                            } catch (errorJSONParse) {
                                callback(null, null);
                            }
                        } else {
                            callback(null, null);
                        }
                    });
                }
            }, function (err, results) {
                if (err) {
                    res.redirect('back');
                } else {
                    res.render('books/category', {
                        books: results.books,
                        categories: results.categories,
                        sortBookBy: results.sortBookBy,
                    });
                }
            });
        }
    });
});

router.post('/review/:id', authorize.isAuthenticated, function (req, res, next) {
    req.checkBody('content').notEmpty().len(1, 255);

    req.getValidationResult().then(function (result) {
        if (!result.isEmpty()) {
            req.flash('errors', result.array());
            res.redirect('/books/' + req.params.id + '#form-review');
        } else {
            var star = req.body.star != 0 ? req.body.star : 1;
            request.post({
                url: req.configs.api_base_url + 'books/review/' + req.params.id,
                form: {
                    'item':
                    {
                        'content': req.body.content,
                        'star': star
                    }
                },
                headers: objectHeaders.headers({'Authorization': req.session.access_token})
            }, function (error, response, body) {
                if (!error && response.statusCode === 200) {
                    try {
                        req.flash('info', 'Thank for your review');
                        res.redirect('back');
                    } catch (errorJSONParse) {
                        res.redirect('back');
                    }
                } else {
                    if (response.statusCode == 401) {
                        req.flash('error', 'Please login to review this book');
                        res.redirect('back');
                    } else {
                        req.flash('error', 'Don\'t allow review this book');
                        res.redirect('back');
                    }
                }
            });
        }
    });
});

router.post('/booking/:id', authorize.isAuthenticated, function (req, res, next) {
    req.checkParams('id', 'Invalid book_id').notEmpty().isInt();
    req.checkBody('owner_id', 'Invalid owner_id').notEmpty().isInt();
    req.checkBody('status', 'Invalid status').notEmpty().isInt();

    req.getValidationResult().then(function (result) {
        if (!result.isEmpty()) {
            req.flash('errors', result.array());
            res.redirect('/books/' + req.params.id + '#form-review');
        } else {
            var form = {
                item: {
                    book_id: req.params.id,
                    owner_id: req.body.owner_id,
                    status: req.body.status
                }
            };
            request.post({
                url: req.configs.api_base_url + 'books/booking',
                form: form,
                headers: objectHeaders.headers({'Authorization': req.session.access_token})
            }, function (error, response, body) {
                if (!error && response.statusCode === 200) {
                    try {
                        req.flash('info', 'Booking success');
                        res.redirect('back');
                    } catch (errorJSONParse) {
                        res.redirect('back');
                    }
                } else {
                    if (response.statusCode === 401) {
                        req.flash('error', 'Please login to booking this book');
                        res.redirect('back');
                    } else if (response.statusCode === 500) {
                        req.flash('error', JSON.parse(body).message.description);
                        res.redirect('back');
                    } else {
                        req.flash('error', 'Don\'t allow booking this book');
                        res.redirect('back');
                    }
                }
            });
        }
    });
});

router.get('/:id/edit', authorize.isAuthenticated, function (req, res, next) {
    async.parallel({
        offices: function (callback) {
            request({
                url: req.configs.api_base_url + 'offices',
                headers: objectHeaders.headers
            }, function (error, response, body) {
                if (!error && response.statusCode === 200) {
                    try {
                        var offices = JSON.parse(body);
                        callback(null, offices);
                    } catch (errorJSONParse) {
                        callback(null, null);
                    }
                } else {
                    callback(null, null);
                }
            });
        },
        categories: function (callback) {
            request({
                url: req.configs.api_base_url + 'categories',
                headers: objectHeaders.headers
            }, function (error, response, body) {
                if (!error && response.statusCode === 200) {
                    try {
                        var categories = JSON.parse(body);
                        callback(null, categories);
                    } catch (errorJSONParse) {
                        callback(null, null);
                    }
                } else {
                    callback(null, null);
                }
            });
        },
        book: function (callback) {
            request({
                url: req.configs.api_base_url + 'books/' + req.params.id,
                headers: objectHeaders.headers({'Authorization': req.session.access_token})
            }, function (error, response, body) {
                if (!error && response.statusCode === 200) {
                    try {
                        var book = JSON.parse(body);
                        callback(null, book);
                    } catch (errorJSONParse) {
                        callback(null, null);
                    }
                } else {
                    callback(null, null);
                }
            });
        }
    }, function (err, results) {
        if (err) {
            res.redirect('back');
        } else {
            res.render('books/edit', {
                categories: results.categories,
                offices: results.offices,
                officeId: req.session.office_id,
                book: results.book
            });
        }
    });
});

module.exports = router;
