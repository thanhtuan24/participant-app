import PageLayout from "@components/layout/PageLayout";
import React, { useState, useEffect } from "react";
import { useStore } from "@store";
import CreateFeedbackSuccess from "./CreateFeedbackSuccess";
import CreateFeedbackForm from "./CreateFeedbackForm";

export interface IUploadImageResponse {
    domain: string;
    images: string[];
}

export interface FormItemValidate {
    status: "default" | "error";
    errorText?: string;
}

export interface FormValidate {
    title: FormItemValidate;
    content: FormItemValidate;
}

const CreateFeedbackPage: React.FC = () => {
    const getUser = useStore(state => state.getUserInfo);
    
    const [user] = useStore(state => [
        state.user,
    ]);
    const [feedbackSucess, setFeedbackSuccess] = useState<boolean>(false);

    useEffect(() => {
        (async () => {
            
            // eslint-disable-next-line no-unused-expressions
            !user && (await getUser());
        })();
        
    }, []);
    return (
        <PageLayout title="Trở về">
            {feedbackSucess ? (
                <CreateFeedbackSuccess />
            ) : (
                <CreateFeedbackForm
                    successCallback={result => {
                        setFeedbackSuccess(Boolean(result));
                    }}
                />
            )}
        </PageLayout>
    );
};

export default CreateFeedbackPage;
