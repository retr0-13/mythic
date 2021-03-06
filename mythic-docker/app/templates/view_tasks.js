document.title = "All Callbacks";
/* eslint-disable no-unused-vars */
// this is called from within browser_scripts functions, not directly
var support_scripts = {};
/* eslint-enable no-unused-vars */
var browser_scripts = {}
try {
    eval(atob(" {{support_scripts}} "));
} catch (error) {
    alertTop("danger", "Support Scripting error: " + error.toString());
}
try {
    eval(atob(" {{browser_scripts}} "));
} catch (error) {
    alertTop("danger", "Browser Scripting error: " + error.toString());
}
//[{callback info, "tasks": [{task info, "responses": [{response info}]}]},
// {callback2, "tasks": [{task_info, "responses": [{response info}]}]}
//]
var tag_info = new Vue({
    el: '#addTagModalData',
    data: {
        tags: [],
        selected_tag: "Select One...",
        current_tags: ""
    },
    delimiters: ['[[',']]']
})
var tasks_div = new Vue({
    el: '#tasks_div',
    data: {
        callbacks: [],
        page_size: 15,
        current_page: 1,
        total_count: 0
    },
    methods: {
        toggle_comment: function(task){
            if(task.comment_visible){
                Vue.set(task, 'comment_visible', false);
            }else{
                Vue.set(task, 'comment_visible', true);
            }
        },
        toggle_arrow: function(task){
            $('#cardbody' + task.id).unbind('shown.bs.collapse').on('shown.bs.collapse', function(){
                httpGetAsync("{{http}}://{{links.server_ip}}:{{links.server_port}}{{links.api_base}}/tasks/" + task.id, (response)=>{
                     try{
                         let data = JSON.parse(response);
                         task.response = data['responses'];
                         if(task['command_id'] in browser_scripts){
                             try{
                                task['use_scripted'] = true;
                                task['scripted'] = browser_scripts[task['command_id']](task, Object.values(task['response']));
                            }catch(error){
                                task["use_scripted"] = false
                                 task["scripted"] = "";
                                console.log(error.toString());
                                alertTop("warning", task["command"] + " hit a browserscript exception");
                            }
                        }
                        tasks_div.$forceUpdate();
                     }catch(error){
                         alertTop("danger", "Session expired, please refresh");
                     }
                 }, "GET", null);
                $('#color-arrow' + task.id).removeClass('fa-plus').addClass('fa-minus');
            });
            $('#cardbody' + task.id).unbind('hidden.bs.collapse').on('hidden.bs.collapse', function(){
                $('#color-arrow' + task.id).removeClass('fa-minus').addClass('fa-plus');
            });
        },
        download_raw_output: function(taskid){
            httpGetAsync("{{http}}://{{links.server_ip}}:{{links.server_port}}{{links.api_base}}/tasks/" + taskid + "/raw_output", (response)=>{
                try{
                    let data = JSON.parse(response);
                    if(data['status'] === 'success'){
                        download_from_memory("task_" + taskid + ".txt", data['output']);
                    }else{
                        alertTop("warning", data['error']);
                    }
                }catch(error){
                    alertTop("danger", "Session expired, please refresh");
                    console.log(error.toString());
                }
            }, "GET", null);

        },
        update_view: function(task){
            Vue.set(task, 'use_scripted', !task['use_scripted']);
            this.$forceUpdate();
        },
        make_active: function(callback){
            httpGetAsync("{{http}}://{{links.server_ip}}:{{links.server_port}}{{links.api_base}}/callbacks/" + callback['id'],make_active_callback,"PUT", {"active":true});
        },
        toggle_show_params: function(id){
            let img = document.getElementById("toggle_task" + id).nextElementSibling;
            if (img.style.display === "") {
                img.style.display = "none";
            } else {
                img.style.display = "";
            }
        },
        add_comment: function(task){
            $( '#addCommentTextArea' ).val(task.comment);
            $('#addCommentModal').on('shown.bs.modal', function () {
                $('#addCommentTextArea').focus();
                $("#addCommentTextArea").unbind('keyup').on('keyup', function (e) {
                    if (e.keyCode === 13) {
                        $( '#addCommentSubmit' ).click();
                    }
                });
            });
            $( '#addCommentModal' ).modal('show');
            $( '#addCommentSubmit' ).unbind('click').click(function(){
                httpGetAsync("{{http}}://{{links.server_ip}}:{{links.server_port}}{{links.api_base}}/tasks/comments/" + task.id, update_callback_comment_callback, "POST", {"comment": $('#addCommentTextArea').val()});
            });
        },
        view_stdout_stderr: function(task){
            httpGetAsync("{{http}}://{{links.server_ip}}:{{links.server_port}}{{links.api_base}}/tasks/stdoutstderr/" + task.id, (response) => {
                try{
                    let data = JSON.parse(response);
                    if(data["status"] === "success"){
                        let text_msg = "stdout:\n" + data["stdout"] + "\n\nstderr:\n" + data["stderr"];
                        $('#addCommentTextArea').val(text_msg);
                        $('#commentModalTitle').text("Stdout/Stderr");
                        $('#addCommentModal').modal('show');
                        $('#addCommentModal').on('shown.bs.modal', function () {
                            $('#addCommentTextArea').focus();
                        });
                        $('#addCommentSubmit').unbind('click').click(function () {});
                    }else{
                        alertTop("error", data["error"]);
                    }
                }catch(error){
                    console.log(error);
                }

            }, "GET", null);
        },
        view_all_parameters: function(task){
            httpGetAsync("{{http}}://{{links.server_ip}}:{{links.server_port}}{{links.api_base}}/tasks/all_params/" + task.id, (response) => {
                try{
                    let data = JSON.parse(response);
                    if(data["status"] === "success"){
                        let text_msg = "Display Parameters:\n" + data["display_params"] + "\n\nOriginal Parameters:\n" + data["original_params"];
                        text_msg += "\n\nFinal Params:\n" + data["params"];
                        $('#addCommentTextArea').val(text_msg);
                        $('#commentModalTitle').text("All Parameters");
                        $('#addCommentModal').modal('show');
                        $('#addCommentModal').on('shown.bs.modal', function () {
                            $('#addCommentTextArea').focus();
                        });
                        $('#addCommentSubmit').unbind('click').click(function () {});
                    }else{
                        alertTop("error", data["error"]);
                    }
                }catch(error){
                    console.log(error);
                }

            }, "GET", null);
        },
        add_tag: function(){
            tag_info.current_tags += "\n" + tag_info.selected_tag;
        },
        view_all_tags: function(task){
            tag_info.selected_tag = "Select One...";
            httpGetAsync("{{http}}://{{links.server_ip}}:{{links.server_port}}{{links.api_base}}/tasks/tags/", (response) => {
                try{
                    let data = JSON.parse(response);
                    if( data["status"] === "success"){
                       tag_info.tags = data["tags"].sort();
                       tag_info.tags.unshift("Select One...");
                    }else{
                        alertTop("warning", data["error"]);
                    }
                }catch(error){
                    console.log(error);
                    alertTop("danger", "Failed to make web request: " + error.toString());
                }
            }, "GET",null);
            httpGetAsync("{{http}}://{{links.server_ip}}:{{links.server_port}}{{links.api_base}}/tasks/tags/" + task.id, (response) => {
                try{
                    let data = JSON.parse(response);
                    if( data["status"] === "success"){
                        tag_info.current_tags = data["tags"].join("\n");
                        $('#addTagModal').modal('show');
                        $('#addTagModal').on('shown.bs.modal', function () {
                            $('#addTagTextArea').focus();
                            $("#addTagTextArea").unbind('keyup').on('keyup', function (e) {
                                if (e.keyCode === 13 && !e.shiftKey) {
                                    $('#addTagSubmit').click();
                                }
                            });
                        });
                    }else{
                        alertTop("warning", data["error"]);
                    }
                }catch(error){
                    console.log(error);
                    alertTop("danger", "Failed to make web request: " + error.toString());
                }
            }, "GET",null);
            $('#addTagSubmit').unbind('click').click(function () {
                httpGetAsync("{{http}}://{{links.server_ip}}:{{links.server_port}}{{links.api_base}}/tasks/tags/" + task.id, (response) => {
                    try{
                        let data = JSON.parse(response);
                        if( data["status"] === "success"){
                            alertTop("success","Successfully updated tags");
                        }else{
                            alertTop("warning", data["error"]);
                        }
                    }catch(error){
                        console.log(error);
                        alertTop("danger", "Failed to make web request: " + error.toString());
                    }
                }, "PUT", {"tags": tag_info.current_tags.split("\n")});
            });
        },
        view_opsec_block: function(task){
            let text_msg = "";
            if (task.opsec_pre_blocked !== null){
                text_msg += "OPSEC PreCheck Message";
                if (task.opsec_pre_bypassed){
                    text_msg += " ( bypassed by " + task.opsec_pre_bypass_user + " )";
                }
                text_msg += ":\n\n" + task.opsec_pre_message + "\n";
            }
            if (task.opsec_post_blocked !== null){
                text_msg += "OPSEC PostCheck Message";
                if (task.opsec_post_bypassed){
                    text_msg += " ( bypassed by " + task.opsec_post_bypass_user + " )";
                }
                text_msg += ":\n\n" + task.opsec_post_message + "\n";
            }

            $('#addCommentTextArea').val(text_msg);
            $('#commentModalTitle').text("OPSEC Messages");
            $('#addCommentModal').modal('show');
            $('#addCommentModal').on('shown.bs.modal', function () {
                $('#addCommentTextArea').focus();
            });
            $('#addCommentSubmit').unbind('click').click(function () {});
        },
        submit_opsec_bypass_request: function(task){
          httpGetAsync("{{http}}://{{links.server_ip}}:{{links.server_port}}{{links.api_base}}/tasks/" + task.id + "/request_bypass/" , (response) => {

            }, "GET", null);
        },
        reissue_request: function(task){
          httpGetAsync("{{http}}://{{links.server_ip}}:{{links.server_port}}{{links.api_base}}/tasks/reissue_task_webhook" , (response) => {
                try{
                    let data = JSON.parse(response);
                    if(data["status"] === "error"){
                        alertTop("warning", data["error"]);
                    }
                }catch(error){
                    console.log(error.toString());
                }
            }, "POST", {"input": {"task_id": task.id}});
        },
        remove_comment: function(id){
            httpGetAsync("{{http}}://{{links.server_ip}}:{{links.server_port}}{{links.api_base}}/tasks/comments/" + id, update_callback_comment_callback, "DELETE", null);
        },
        load_tasks: function(callback){
            for(let i = 0; i < tasks_div.callbacks.length; i++){
                if(tasks_div.callbacks[i]['id'] === callback.id){
                    if('tasks' in tasks_div.callbacks[i]){
                        delete tasks_div.callbacks[i]['tasks'];
                        tasks_div.$forceUpdate();
                        return;
                    }
                    httpGetAsync("{{http}}://{{links.server_ip}}:{{links.server_port}}{{links.api_base}}/tasks/callback/" + callback.id , get_callback_tasks_callback, "GET", null);
                    alertTop("info", "Loading...", 1);
                    return;
                }
            }
            httpGetAsync("{{http}}://{{links.server_ip}}:{{links.server_port}}{{links.api_base}}/tasks/callback/" + callback.id , get_callback_tasks_callback, "GET", null);
            alertTop("info", "Loading...", 1);
        },
        get_page: function(page){
            let filter_query = $('#filter').val();
            if(filter_query === ""){
                httpGetAsync("{{http}}://{{links.server_ip}}:{{links.server_port}}{{links.api_base}}/callbacks/" + page + "/" + this.page_size, set_callback_data_callback, "GET", null);
            }else{
                let data = {"search": filter_query, "page": page, "size": this.page_size};
                httpGetAsync("{{http}}://{{links.server_ip}}:{{links.server_port}}{{links.api_base}}/callbacks/search", set_callback_data_callback, "POST", data);
            }

        },
        get_new_page_size: function(){
            let page_size = $('#page_size').val();
            let filter_query = $('#filter').val();
            if(filter_query !== ""){
                let data = {"search": filter_query, "page": 1, "size": page_size};
                httpGetAsync("{{http}}://{{links.server_ip}}:{{links.server_port}}{{links.api_base}}/callbacks/search", set_callback_data_callback, "POST", data);
            }else{
                httpGetAsync("{{http}}://{{links.server_ip}}:{{links.server_port}}{{links.api_base}}/callbacks/" + 1 + "/" + page_size, set_callback_data_callback, "GET", null);
            }

            this.page_size = page_size;
        },
        filter: function(){
            let filter_query = $('#filter').val();
            let data = {"search": filter_query, "size": this.page_size, "page": 1};
            httpGetAsync("{{http}}://{{links.server_ip}}:{{links.server_port}}{{links.api_base}}/callbacks/search", set_callback_data_callback, "POST", data);
            this.current_page = 1;
        }
    },
    delimiters: ['[[', ']]']
});
httpGetAsync("{{http}}://{{links.server_ip}}:{{links.server_port}}{{links.api_base}}/callbacks/1/15", set_callback_data_callback, "GET", null);
function set_callback_data_callback(response){
    try{
        let data = JSON.parse(response);
        if(data['status'] !== 'success'){
            alertTop("danger", data['error'], 2);
        }else{
            tasks_div.callbacks = [];
             for(let t in data['callbacks']){
                data['callbacks']['tasks'] = [];
                tasks_div.callbacks.push(data['callbacks'][t]);
             }
             tasks_div.total_count = data['total_count'];
             tasks_div.current_page = data['page'];
             tasks_div.page_size = data['size'];
        }
        //console.log(data);
    }catch(error){
        alertTop("danger", "Session expired, please refresh");
    }
}
function make_active_callback(response){
    try{
        let data = JSON.parse(response);
        if(data['status'] === 'success'){
            for(let i = 0; i < tasks_div.callbacks.length; i++){
                if(tasks_div.callbacks[i].id === data['id']){
                    Vue.set(tasks_div.callbacks[i], 'active', data['active']);
                    return;
                }
            }
        }
        else{
            alertTop("danger", data['error']);
        }
    }catch(error){
        alertTop("danger", "Session expired, please refresh");
    }
}

function get_callback_tasks_callback(response){
    if(response !== "" && response !== undefined){
        let data = JSON.parse(response);
        if(data.length > 0){
            for(let i = 0; i < tasks_div.callbacks.length; i++){
                if(tasks_div.callbacks[i]['id'] === data[0]['callback']){
                    data.forEach(function(x){
                        x['href'] = "{{http}}://{{links.server_ip}}:{{links.server_port}}/tasks/" + x.id;
                    });
                    Vue.set(tasks_div.callbacks[i], 'tasks', data);
                    alertTop("success", "Loaded", 1);
                    return;
                }
            }
        }
        alertTop("success", "No tasks", 1);
    }else{
        alertTop("danger", "There was an error loading the tasks", 2);
    }

}
function update_callback_comment_callback(response){
    try{
        let data = JSON.parse(response);
        if(data['status'] === 'success'){
            data = data['task'];
            for(let i = 0; i < tasks_div.callbacks.length; i++){
                if(data['callback'] === tasks_div.callbacks[i]['id']){
                    for(let j = 0; j < tasks_div.callbacks[i]['tasks'].length; j++){
                        if(data['id'] === tasks_div.callbacks[i]['tasks'][j]['id']){
                            tasks_div.callbacks[i]['tasks'][j]['comment'] = data['comment'];
                            tasks_div.callbacks[i]['tasks'][j]['comment_operator'] = data['comment_operator'];
                            return;
                        }
                    }
                }
            }
        }else{
            alertTop("danger", data['error']);
        }
    }catch(error){
        alertTop("danger", "Session expired, please refresh");
    }
}