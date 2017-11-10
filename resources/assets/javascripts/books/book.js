var Book = {};

Book.init = function () {
    var scope = this;
    scope.modalBooking();
};

Book.configs = function () {
    return configs.book;
};

Book.checkAuthorized = function () {
    if (typeof(access_token) === 'undefined' || typeof(user) === 'undefined') {
        showNotify('danger', 'Please login before action', {icon: 'glyphicon glyphicon-remove'}, {delay: 3000});

        return false;
    }

    return true;
};

Book.loadMoreBook = function (data) {
    var scope = this;
    var url = data.field !== undefined ?
        API_PATH + 'books/?field=' + data.field + '&page=' + data.nextPage
        : API_PATH + 'books/category/' + data.categoryId + '/?page=' + data.nextPage;

    $.ajax({
        url: url,
        contentType: 'application/json',
        dataType: 'json',
        headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
        method: 'GET'
    }).done(function (response) {
        if (data.field !== undefined) {
            response.item.data.forEach(function (book) {
                $('.row .ajax-book-content').append(scope.generateBookXhtml(book));
            });
        } else {
            response.item.category.data.forEach(function (book) {
                $('.row .ajax-book-content').append(scope.generateBookXhtml(book));
            });
        }

        if (response.item.next_page !== null) {
            $('.btn-loadmore-book').attr('data-next-page', response.item.next_page);
        } else {
            $('.btn-loadmore-book').remove();
        }

    }).fail(function (errors) {
        var msg = '';
        if (typeof(errors.responseJSON.message.description) !== 'undefined') {
            errors.responseJSON.message.description.forEach(function (err) {
                msg += err;
            });
        } else {
            msg = 'Can\'t load more';
        }

        showNotify('danger', msg, {icon: 'glyphicon glyphicon-remove'}, {delay: 3000});
    });
};

Book.generateBookXhtml = function (book) {
    var scope = this;
    var thumbnailPath = book.image && book.image.web.thumbnail_path !== undefined
        ? book.image.web.thumbnail_path
        : '/images/book_thumb_default.jpg';
    var bookTitle = (book.title && book.title.length) > scope.configs.title_limit_characters
        ? (book.title.substring(0, scope.configs.title_limit_characters) + ' ...')
        : book.title;
    var bookAuthor = (book.author && book.author.length) > scope.configs.author_limit_characters
        ? (book.author.substring(0, scope.configs.author_limit_characters) + ' ...')
        : book.author;

    var xhtml = '';
    xhtml += '<div class="col-xs-12 col-md-6">';
    xhtml += '<div class="category-item well yellow">';
    xhtml += '<div class="media">';
    xhtml += '<span class="badge badge-notify">' + book.office.name + '</span>';
    xhtml += '<div class="media-left">';
    xhtml += '<img src="'+ thumbnailPath +'" class="media-object" alt="Framgia Book">';
    xhtml += '</div>';
    xhtml += '<div class="media-body">';
    xhtml += '<h5 title="'+ bookTitle +'">' + bookTitle + '</h5>';
    xhtml += '<h6 title="'+ bookAuthor +'">' + bookAuthor + '</h6>';
    xhtml += '<div class="space-10"></div>';
    xhtml += '<input id="rating-book" name="star" class="rating" disabled="true" value="' + book.avg_star + '"data-size="xs">';
    xhtml += '</ul>';
    xhtml += '<div class="space-10"></div>';
    xhtml += '<p>'+ book.overview +'</p>';
    xhtml += '<a href="/books/'+ book.id +'" class="text-primary">View detail</a>';
    xhtml += '</div>';
    xhtml += '</div>';
    xhtml += "<div class='owners'> <strong> Shared by: </strong>";

    if (book.owners) {
        var countOwner = 0;
        book.owners.forEach(function (index, owner) {
            if (index === 6) {
                xhtml += '<strong> ... </strong>';
                return;
            }

            xhtml += "<img data-toggle='tooltip'";
            xhtml += "class='owner-image-home img-circle'";
            xhtml += "title='" + owner.name + "' src='";

            if (owner && owner.avatar) {
                xhtml += owner.avatar;
            } else {
                xhtml += '/images/user_default.png';
            }

            xhtml += "'class='media-object author-photo img-thumbnail background--white' alt='library'>";

        })
    }

    xhtml += '</div>';
    xhtml += '</div>';
    xhtml += '</div>';
    xhtml += '<script src="/bower/bootstrap-star-rating/js/star-rating.js"></script>';
    xhtml += '<link href="/bower/bootstrap-star-rating/css/star-rating.css" rel="stylesheet" type="text/css">';
    xhtml += '<link href="/bower/bootstrap-star-rating/css/theme-krajee-fa.css" rel="stylesheet" type="text/css">';

    return xhtml;
};

Book.return = function (data) {
    swal({
        title: "Are you sure return this book?",
        type: "info",
        showCancelButton: true,
        confirmButtonColor: "#DD6B55",
        confirmButtonText: "Yes",
        closeOnConfirm: true
    },
    function() {
        if (typeof(access_token) === 'undefined' || typeof(user) === 'undefined') {
            showNotify('danger', 'Return fail, Please login to continue', {icon: 'glyphicon glyphicon-remove'}, {delay: 3000});

            return false;
        }

        var body = JSON.stringify({
            item: {
                book_id: data.book_id,
                owner_id: data.owner_id,
                status: data.status
            }
        });

        $.ajax({
            url: API_PATH + 'books/booking',
            dataType: 'json',
            headers: {'Content-Type': 'application/json', 'Accept': 'application/json', 'Authorization': access_token},
            method: 'POST',
            data: body
        }).done(function () {
            window.location.reload();
            showNotify('success', 'Return success', {icon: 'glyphicon glyphicon-ok'}, {delay: 1000});
        }).fail(function () {
            window.location.reload();
            showNotify('danger', 'Return errors', {icon: 'glyphicon glyphicon-remove'}, {delay: 1000});
        });
    });
};

Book.cancel = function (data) {
    swal({
        title: "Are you sure cancel waiting this book?",
        type: "info",
        showCancelButton: true,
        confirmButtonColor: "#DD6B55",
        confirmButtonText: "Yes",
        closeOnConfirm: true
    },
    function() {
        if (typeof(access_token) === 'undefined' || typeof(user) === 'undefined') {
            showNotify('danger', 'Cancel fail, Please login to continue', {icon: 'glyphicon glyphicon-remove'}, {delay: 3000});

            return false;
        }

        var body = JSON.stringify({
            item: {
                book_id: data.book_id,
                owner_id: data.owner_id,
                status: data.status
            }
        });

        $.ajax({
            url: API_PATH + 'books/booking',
            dataType: 'json',
            headers: {'Content-Type': 'application/json', 'Accept': 'application/json', 'Authorization': access_token},
            method: 'POST',
            data: body
        }).done(function () {
            window.location.reload();
            showNotify('success', 'Cancel waiting success', {icon: 'glyphicon glyphicon-ok'}, {delay: 1000});
        }).fail(function () {
            window.location.reload();
            showNotify('danger', 'Cancel waiting errors', {icon: 'glyphicon glyphicon-remove'}, {delay: 1000});
        });
    });
};

Book.generateUserXhtml = function (user) {
    var xhtml = '';
    xhtml += '<div class="col-xs-12 col-sm-8 col-sm-offset-2 col-md-9" id="user-'+ user.id +'">';
    xhtml += '<div class="event-item wow fadeInRight">';
    xhtml += '<div class="well">';
    xhtml += '<div class="media">';
    xhtml += '<div class="media-left">';

    if (user.avatar !== null) {
        xhtml += '<img src="'+ user.avatar +'" class="media-object w-70-h-70" alt="library">';
    } else {
        xhtml += '<img src="/images/user/icon_user_default.png" class="media-object w-70-h-70" alt="library">';
    }
    xhtml += '</div>';
    xhtml += '<div class="media-body">';
    xhtml += '<div class="space-10"></div>';
    xhtml += '<a href="#"><h4 class="media-heading">'+ user.name +'</h4></a>';
    xhtml += '<div class="space-10"></div>';
    xhtml += '<p>'+ user.name +'</p>';
    xhtml += '</div>';
    xhtml += '</div>';
    xhtml += '</div>';
    xhtml += '</div>';
    xhtml += '<div class="space-20"></div>';
    xhtml += '</div>';

    return xhtml;
};

Book.ajaxSortBook = function (data) {
    var scope = this;
    var body = JSON.stringify({
        sort : {
            by: data.sortBy,
            order_by: data.orderBy
        }
    });
    var url = (data.field !== undefined) ?
        (API_PATH + 'books/filters?field=' + data.field + '&page=' + data.currentPage)
        : (API_PATH + 'books/category/' + data.categoryId + '/filter/?page=' + data.currentPage);

    if (data.officeId !== undefined) {
        url += '&office_id=' + data.officeId;
    }

    $.ajax({
        url: url,
        dataType: 'json',
        headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
        method: 'POST',
        data: body
    }).done(function (response) {
        var result = data.field !== undefined ? response.items : response.items.category;

        if (result.data.length > 0) {
            var elementBookContent = $('.row .ajax-book-content');
            var xhtml = '';

            elementBookContent.empty();
            result.data.forEach(function (book) {
                xhtml += scope.generateBookXhtml(book);
            });
            elementBookContent.html(xhtml);

            showNotify('success', 'Sort books success', {icon: 'glyphicon glyphicon-ok'}, {delay: 2000});
        }
    }).fail(function (errors) {
        var msg = '';
        if (typeof(errors.responseJSON.message.description) !== 'undefined') {
            errors.responseJSON.message.description.forEach(function (err) {
                msg += err;
            });
        } else {
            msg = 'Can\'t load more';
        }

        showNotify('danger', msg, {icon: 'glyphicon glyphicon-remove'}, {delay: 3000});
    });
};

$('#publish_date').datepicker({
    format: 'yyyy-mm-dd'
});

$('.loader').hide();

Book.addNew = function () {
    var scope = this;
    if (!scope.checkAuthorized()) return false;

    if (!$('#form-add-book').valid()) {
        return false;
    }

    $('.loader').show();
    var formData = new FormData();
    formData.append('title', $('#title').val().trim());
    formData.append('author', $('#author').val().trim());
    formData.append('category_id', $('#category').val().trim());
    formData.append('office_id', $('#office').val().trim());
    formData.append('publish_date', $('#publish_date').val());
    formData.append('description', $('#description').val().trim());

    //Attach file
    if ($("[name='image']")[0].files[0]) {
        for (var i = 0; i < $("[name='image']").length; i++) {
            formData.append('medias[' + i + '][file]', $("[name='image']")[i].files[0]);

            if (i === 0) {
                formData.append('medias[' + i + '][type]', 1);
            } else {
                formData.append('medias[' + i + '][type]', 0);
            }
        }
    }

    $.ajax({
        url: API_PATH + 'books',
        headers: {'Accept': 'application/json', 'Authorization': access_token},
        method: 'POST',
        contentType:false,
        cache: false,
        processData:false,
        data: formData
    }).done(function (res) {
        if (res.message.status && res.message.code === 200) {
            window.location.href = '/home';
        }
    }).fail(function (errors) {
        $('.loader').hide();
        var msg = '';
        if (typeof(errors.responseJSON.message.description) !== 'undefined') {
            errors.responseJSON.message.description.forEach(function (err) {
                msg += err;
            });
        } else {
            msg = 'Can\'t load more';
        }

        showNotify('danger', msg, {icon: 'glyphicon glyphicon-remove'}, {delay: 3000});
    });
};

Book.editBook = function () {
    var scope = this;
    if (!scope.checkAuthorized()) return false;

    if (!$('#form-add-book').valid()) {
        return false;
    }

    // $('.loader').show();
    var formData = new FormData();
    formData.append('title', $('#title').val().trim());
    formData.append('author', $('#author').val().trim());
    formData.append('category_id', $('#category').val().trim());
    formData.append('office_id', $('#office').val().trim());
    formData.append('publish_date', $('#publish_date').val());
    formData.append('description', $('#description').val().trim());

    //Attach file
    if ($("[name='image']")[0].files[0]) {
        for (var i = 0; i < $("[name='image']").length; i++) {
            formData.append('medias[' + i + '][file]', $("[name='image']")[i].files[0]);

            if (i === 0) {
                formData.append('medias[' + i + '][type]', 1);
            } else {
                formData.append('medias[' + i + '][type]', 0);
            }
        }
    }

    $.ajax({
        url: API_PATH + 'books/' + $('.edit_book_id').data('edit-book-id'),
        headers: {'Accept': 'application/json', 'Authorization': access_token},
        method: 'PUT',
        contentType:false,
        cache: false,
        processData:false,
        data: formData
    }).done(function (res) {
        if (res.message.status && res.message.code === 200) {
            window.location.href = '/home';
        }
    }).fail(function (errors) {
        $('.loader').hide();
        var msg = '';
        if (typeof(errors.responseJSON.message.description) !== 'undefined') {
            errors.responseJSON.message.description.forEach(function (err) {
                msg += err;
            });
        } else {
            msg = 'Can\'t load more';
        }

        showNotify('danger', msg, {icon: 'glyphicon glyphicon-remove'}, {delay: 3000});
    });
};

Book.modalBooking = function () {
    var scope = this;
    var elementBooking = $('button[name=booking]');
    var modalWantToRead = $('#modalWantToRead');

    elementBooking.on('click', function () {
        if (!scope.checkAuthorized()) return false;
        var bookOffice = parseInt($(this).attr('data-office-id'));
        if (user.office_id && bookOffice !== user.office_id) {
            swal({
                title: "The book is not in the your workspace. Want to read book ?",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                confirmButtonText: "Yes",
                closeOnConfirm: true
            }, function () {
                modalWantToRead.modal('show');
            });
        } else {
            modalWantToRead.modal('show');
        }

    });
};

$('.add-owner').on('click', function(e) {
    if (typeof(access_token) === 'undefined' || typeof(user) === 'undefined') {
        showNotify('danger', 'Please login before action', {icon: 'glyphicon glyphicon-remove'}, {delay: 3000});

        return false;
    }
    var bookOffice = parseInt($(this).attr('data-office-id'));
    if (user.office_id && bookOffice !== user.office_id) {
        swal({
            title: "The book is not in the your workspace. Are you want to share book?",
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#DD6B55",
            confirmButtonText: "Yes",
            closeOnConfirm: true
        }, function () {
            window.location.href = '/books/add';
        });
    } else {
        swal({
            title: "Are you sure add owner this book?",
            type: "info",
            showCancelButton: true,
            confirmButtonColor: "#DD6B55",
            confirmButtonText: "Yes",
            closeOnConfirm: true
        },
        function() {
            if (typeof(access_token) === 'undefined' || typeof(user) === 'undefined') {
                showNotify('danger', 'Add owner fail, Please login to continue', {icon: 'glyphicon glyphicon-remove'}, {delay: 3000});

                return false;
            }

            $.ajax({
                url: API_PATH + 'books/add-owner/' + $('.hide-book').data('bookId'),
                contentType: 'application/json',
                dataType: 'json',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': access_token,
                },
                type: 'GET',
            }).done(function (response) {
                if (response.message.status) {
                    var htmlCurrentUser = "<a class='owner-image" + user.id + "' data-toggle='tooltip' title='" + user.name +  "' href='/users/" + user.id + "'>";
                    if (user.avatar) {
                        htmlCurrentUser += "<img src='" + user.avatar + "'";
                        htmlCurrentUser += "class='img-owner-detail img-circle media-object author-photo img-thumbnail background--white' alt='library'>";
                    } else {
                        htmlCurrentUser += "<img class='img-owner-detail img-circle' src='/images/user_default.png'";
                        htmlCurrentUser += "class='media-object author-photo img-thumbnail' alt='library'>";
                    }
                    htmlCurrentUser += "</a>"
                    $('.list-owners').append(htmlCurrentUser);

                    $('.add-owner').removeClass().addClass('btn btn-danger btn-sm remove-owner').html("<i class='glyphicon glyphicon-remove'></i> Remove owner this book");
                    showNotify('success', 'Add owner success', {icon: 'glyphicon glyphicon-ok'}, {delay: 3000});
                } else {
                    showNotify('danger', 'Add owner fail', {icon: 'glyphicon glyphicon-remove'}, {delay: 3000});
                }
            }).fail(function (error) {
                showNotify('danger', error.responseJSON.message.description, {icon: 'glyphicon glyphicon-remove'}, {delay: 3000});
            });
        });
    }
});

$('.btn-action').on('click', '.remove-owner', function (e) {
    swal({
        title: "Are you sure remove owner this book?",
        type: "info",
        showCancelButton: true,
        confirmButtonColor: "#DD6B55",
        confirmButtonText: "Yes",
        closeOnConfirm: true
    },
    function() {
        if (typeof(access_token) === 'undefined' || typeof(user) === 'undefined') {
            showNotify('danger', 'Add owner fail, Please login to continue', {icon: 'glyphicon glyphicon-remove'}, {delay: 3000});

            return false;
        }

        $.ajax({
            url: API_PATH + 'books/remove-owner/' + $('.hide-book').data('bookId'),
            contentType: 'application/json',
            dataType: 'json',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': access_token,
            },
            type: 'GET',
        }).done(function (response) {
            if (response.message.status) {
                $('.owner-image' + user.id).remove();
                $('.remove-owner').removeClass().addClass('btn btn-primary btn-sm add-owner').html("<i class='glyphicon glyphicon-plus'></i> Add owner this book");
                showNotify('success', 'Remove owner success', {icon: 'glyphicon glyphicon-ok'}, {delay: 3000});
            } else {
                showNotify('danger', 'Remove owner fail', {icon: 'glyphicon glyphicon-remove'}, {delay: 3000});
            }
        }).fail(function (error) {
            showNotify('danger', error.responseJSON.message.description, {icon: 'glyphicon glyphicon-remove'}, {delay: 3000});
        });
    });
});

function approveRequestWaiting(userId)
{
    swal({
        title: "Are you sure approve this request?",
        type: "info",
        showCancelButton: true,
        confirmButtonColor: "#DD6B55",
        confirmButtonText: "Yes",
        closeOnConfirm: true
    },
    function() {
        if (typeof(access_token) === 'undefined') {
            showNotify('danger', 'Approve request fail, Please login to continue', {icon: 'glyphicon glyphicon-remove'}, {delay: 3000});

            return false;
        }

        $.ajax({
            url: API_PATH + 'books/approve/' + $('.hide-book').data('bookId'),
            contentType: 'application/json',
            dataType: 'json',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': access_token,
            },
            type: 'POST',
            data: JSON.stringify({
                item: {
                    user_id: userId,
                    key: 'approve'
                }
            }),
        }).done(function (response) {
            if (response.message.status) {
                $('.btn-approve').addClass('hidden');
                $('.lbl-waiting' + userId).removeClass().addClass('label label-success').addClass('lbl-reading' + userId).html('reading');
                $('.btn-approve-waiting' + userId).attr('onClick', 'unapproveRequestWaiting(' + userId + ')');
                $('.btn-approve-waiting' + userId).removeClass('hidden btn-approve-waiting' + userId).addClass('btn-unapprove-reading' + userId).addClass('btn-xs').html('Unapprove');

                showNotify('success', 'Request approved', {icon: 'glyphicon glyphicon-ok'}, {delay: 3000});
            } else {
                showNotify('danger', 'Approve request fail', {icon: 'glyphicon glyphicon-remove'}, {delay: 3000});
            }
        }).fail(function (error) {
            showNotify('danger', error.responseJSON.message.description, {icon: 'glyphicon glyphicon-remove'}, {delay: 3000});
        });
    });
}

function approveRequestReturning(userId)
{
    swal({
        title: "Are you sure approve this request?",
        type: "info",
        showCancelButton: true,
        confirmButtonColor: "#DD6B55",
        confirmButtonText: "Yes",
        closeOnConfirm: true
    },
    function() {
        if (typeof(access_token) === 'undefined') {
            showNotify('danger', 'Approve request fail, Please login to continue', {icon: 'glyphicon glyphicon-remove'}, {delay: 3000});

            return false;
        }

        $.ajax({
            url: API_PATH + 'books/approve/' + $('.hide-book').data('bookId'),
            contentType: 'application/json',
            dataType: 'json',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': access_token,
            },
            type: 'POST',
            data: JSON.stringify({
                item: {
                    user_id: userId,
                    key: 'approve'
                }
            }),
        }).done(function (response) {
            if (response.message.status) {
                $('.lbl-returning' + userId).removeClass().addClass('label label-success').addClass('lbl-returned' + userId).html('returned');
                $('.btn-approve-returning' + userId).remove();

                showNotify('success', 'Request approved', {icon: 'glyphicon glyphicon-ok'}, {delay: 3000});
            } else {
                showNotify('danger', 'Approve request fail', {icon: 'glyphicon glyphicon-remove'}, {delay: 3000});
            }
        }).fail(function (error) {
            showNotify('danger', error.responseJSON.message.description, {icon: 'glyphicon glyphicon-remove'}, {delay: 3000});
        });
    });
}

function unapproveRequestWaiting(userId)
{
    swal({
        title: "Are you sure unapprove this request?",
        type: "info",
        showCancelButton: true,
        confirmButtonColor: "#DD6B55",
        confirmButtonText: "Yes",
        closeOnConfirm: true
    },
    function() {
        if (typeof(access_token) === 'undefined') {
            showNotify('danger', 'Approve request fail, Please login to continue', {icon: 'glyphicon glyphicon-remove'}, {delay: 3000});

            return false;
        }

        $.ajax({
            url: API_PATH + 'books/approve/' + $('.hide-book').data('bookId'),
            contentType: 'application/json',
            dataType: 'json',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': access_token,
            },
            type: 'POST',
            data: JSON.stringify({
                item: {
                    user_id: userId,
                    key: 'unapprove'
                }
            }),
        }).done(function (response) {
            if (response.message.status) {
                $('.lbl-reading' + userId).removeClass().addClass('label label-warning').addClass('lbl-waiting' + userId).html('waiting');
                $('.btn-unapprove-reading' + userId).attr('onClick', 'approveRequestWaiting(' + userId + ')');
                $('.btn-unapprove-reading' + userId).removeClass('btn-unapprove-reading' + userId).addClass('btn-approve-waiting' + userId).addClass('btn-xs').html('Approve');
                $('.btn.hidden').removeClass('hidden');

                showNotify('success', 'Request unapproved', {icon: 'glyphicon glyphicon-ok'}, {delay: 3000});
            } else {
                showNotify('danger', 'Unapprove request fail', {icon: 'glyphicon glyphicon-remove'}, {delay: 3000});
            }
        }).fail(function (error) {
            showNotify('danger', error.responseJSON.message.description, {icon: 'glyphicon glyphicon-remove'}, {delay: 3000});
        });
    });
}
